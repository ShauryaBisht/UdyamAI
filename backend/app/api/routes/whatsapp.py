"""Inbound WhatsApp webhook (Twilio).

Twilio posts an ``application/x-www-form-urlencoded`` body here and expects TwiML
back. There is no Supabase session on this channel, so the Twilio request
signature is the authentication model (see :func:`_verify_signature`).

Production enablement
---------------------
1. ``WHATSAPP_ENABLED=true``
2. ``TWILIO_AUTH_TOKEN=<Auth Token from the Twilio Console>``
3. ``WHATSAPP_VERIFY_SIGNATURE=true``
4. ``TWILIO_WEBHOOK_URL=https://<public-host>/webhooks/whatsapp``
5. Point the WhatsApp sender's "When a message comes in" webhook at the same URL (HTTP POST).

Signature verification uses only the standard library (no Twilio SDK). Behind a proxy
the app may see ``http://<internal-host>`` while Twilio signed the public ``https``
URL, which is what ``TWILIO_WEBHOOK_URL`` exists to pin down.

See ``docs/whatsapp-channel.md`` for the full setup walkthrough.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import logging
from collections.abc import Mapping
from xml.sax.saxutils import escape

from fastapi import APIRouter, HTTPException, Request, Response, status
from starlette.concurrency import run_in_threadpool
from starlette.datastructures import FormData

from app.ai.chat import fallback_reply, generate_chat_reply
from app.ai.multilingual import detect_language
from app.config import settings
from app.utils.rate_limiter import RateLimiter

logger = logging.getLogger(__name__)

router = APIRouter()

# WhatsApp caps a text message at ~1600 characters.
_MAX_REPLY_CHARS = 1500

# Short prompt for a request that carries no message body (e.g. a Twilio status
# callback, or a user sending only media). Answered without an LLM call.
_EMPTY_BODY_REPLIES = {
    "en": "Hi! Ask me about business feasibility, government schemes, or finance.",
    "hi": "नमस्ते! व्यवसाय व्यवहार्यता, सरकारी योजनाओं या वित्त के बारे में पूछें।",
}

# Best-effort abuse control, keyed on the sender number rather than the client IP:
# Twilio's egress IPs are shared, so a per-IP limit would throttle every tenant at
# once. Created at import from settings; tests can adjust the instance directly.
_sender_limiter = RateLimiter(
    requests_limit=settings.WHATSAPP_RATE_LIMIT_REQUESTS,
    window_seconds=settings.WHATSAPP_RATE_LIMIT_WINDOW,
)


def _expected_signature(url: str, params: Mapping[str, str], auth_token: str) -> str:
    """``base64(hmac_sha1(auth_token, url + sorted(key + value)))``, per Twilio."""
    payload = url + "".join(f"{key}{params[key]}" for key in sorted(params))
    digest = hmac.new(
        auth_token.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha1,
    ).digest()
    return base64.b64encode(digest).decode("utf-8")


def _signed_url(request: Request) -> str:
    """Reconstruct the URL Twilio signed.

    The configured public URL wins when present; otherwise prefer the proxy headers,
    since the ASGI app often sees an internal scheme/host.
    """
    if settings.TWILIO_WEBHOOK_URL:
        return settings.TWILIO_WEBHOOK_URL

    def _first(value: str | None) -> str | None:
        if not value:
            return None
        return value.split(",")[0].strip() or None

    scheme = _first(request.headers.get("x-forwarded-proto")) or request.url.scheme
    host = (
        _first(request.headers.get("x-forwarded-host"))
        or _first(request.headers.get("host"))
        or request.url.netloc
    )
    return str(request.url.replace(scheme=scheme, netloc=host))


def _form_params(form: FormData) -> dict[str, str]:
    """Flatten the parsed form, keeping the last value for a repeated key.

    Twilio signs every field, so the whole form is needed, not just ``From``/``Body``.
    """
    return {key: str(value) for key, value in form.multi_items()}


def _verify_signature(request: Request, params: Mapping[str, str]) -> None:
    if not settings.WHATSAPP_VERIFY_SIGNATURE:
        return

    if not settings.TWILIO_AUTH_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="TWILIO_AUTH_TOKEN not configured",
        )

    signature = request.headers.get("X-Twilio-Signature", "")
    expected = _expected_signature(_signed_url(request), params, settings.TWILIO_AUTH_TOKEN)
    if not hmac.compare_digest(signature, expected):
        logger.warning("Rejected WhatsApp webhook with an invalid Twilio signature")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid Twilio signature",
        )


def _truncate(message: str, limit: int = _MAX_REPLY_CHARS) -> str:
    """Cut an over-long reply on the last sentence boundary that fits."""
    if len(message) <= limit:
        return message

    window = message[:limit]
    for index in range(len(window) - 1, 0, -1):
        if window[index] in ".!?।\n" and window[index - 1] not in " \t":
            return window[: index + 1].rstrip()
    return window.rstrip()


def _twiml(message: str) -> Response:
    """Build a single-<Message> TwiML response.

    ``escape`` matters: the text is LLM output, which is untrusted as far as XML is
    concerned. The bare ``<Response>`` (no namespace) is what Twilio's own examples
    use.
    """
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f"<Response><Message>{escape(message)}</Message></Response>"
    )
    return Response(content=xml, media_type="application/xml")


@router.post("/whatsapp")
async def whatsapp_webhook(request: Request) -> Response:
    """Twilio WhatsApp inbound webhook.

    Registered under ``/webhooks`` (and ``/api/v1/webhooks``) in ``main.py``.

    Always answers ``200`` with TwiML for anything we handled — a non-2xx makes
    Twilio retry, which would re-run the LLM call and send a duplicate reply. Only
    *rejected* requests get a 4xx/5xx status.
    """
    if not settings.WHATSAPP_ENABLED:
        # Behave as if the route does not exist, so an unconfigured deploy exposes nothing.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")

    form = await request.form()
    params = _form_params(form)

    _verify_signature(request, params)

    # After verification: unauthenticated junk cannot consume a real sender's budget.
    _sender_limiter.check(params.get("From") or "unknown")

    body = (params.get("Body") or "").strip()
    language = detect_language(body)

    if not body:
        # Twilio also posts non-message events here; don't spend an LLM call on them.
        return _twiml(_EMPTY_BODY_REPLIES.get(language, _EMPTY_BODY_REPLIES["en"]))

    try:
        # `generate_chat_reply` is a blocking SDK call, so keep it off the event loop.
        reply, _available = await run_in_threadpool(
            generate_chat_reply,
            message=body,
            history=[],
            language=language,
        )
    except Exception:  # pragma: no cover - generate_chat_reply handles its own failures
        logger.exception("WhatsApp chat generation failed")
        reply = fallback_reply(language)

    return _twiml(_truncate(reply))
