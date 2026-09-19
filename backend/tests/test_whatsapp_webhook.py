"""Tests for the Twilio WhatsApp inbound webhook.

The webhook is the one route that must work *without* the shared Supabase auth
overrides in ``tests/conftest.py``, so a couple of cases below assert that
explicitly.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import time
from unittest.mock import patch
from xml.etree import ElementTree

import pytest

from app.api.routes import whatsapp
from app.config import settings

WEBHOOK_URL = "/webhooks/whatsapp"
VERSIONED_WEBHOOK_URL = "/api/v1/webhooks/whatsapp"
AUTH_TOKEN = "test-auth-token"

# The URL the app reconstructs for a TestClient request. Signature tests must sign
# this exact string.
SIGNED_URL = "http://testserver/webhooks/whatsapp"

SAMPLE_FORM = {
    "From": "whatsapp:+919999999999",
    "Body": "What is PMEGP?",
    "MessageSid": "SM1234567890abcdef",
    "NumMedia": "0",
    "WaId": "919999999999",
}


def _sign(params: dict[str, str], url: str = SIGNED_URL, token: str = AUTH_TOKEN) -> str:
    """Independent implementation of Twilio's signing algorithm.

    Deliberately does not import the route's helper, so a bug there is caught here.
    """
    payload = url + "".join(f"{key}{params[key]}" for key in sorted(params))
    digest = hmac.new(token.encode("utf-8"), payload.encode("utf-8"), hashlib.sha1).digest()
    return base64.b64encode(digest).decode("utf-8")


@pytest.fixture(autouse=True)
def _reset_whatsapp_state():
    """Keep the module-level throttle and SID dedupe from leaking between tests."""
    whatsapp._sender_limiter.request_history.clear()
    whatsapp._sid_cache.clear()
    yield
    whatsapp._sender_limiter.request_history.clear()
    whatsapp._sid_cache.clear()


@pytest.fixture
def enabled(monkeypatch):
    """Webhook on, signature verification off, no ambient Twilio config."""
    monkeypatch.setattr(settings, "WHATSAPP_ENABLED", True)
    monkeypatch.setattr(settings, "WHATSAPP_VERIFY_SIGNATURE", False)
    monkeypatch.setattr(settings, "TWILIO_AUTH_TOKEN", None)
    monkeypatch.setattr(settings, "TWILIO_WEBHOOK_URL", None)


@pytest.fixture
def verifying(monkeypatch, enabled):
    monkeypatch.setattr(settings, "WHATSAPP_VERIFY_SIGNATURE", True)
    monkeypatch.setattr(settings, "TWILIO_AUTH_TOKEN", AUTH_TOKEN)


def _message_text(response) -> str | None:
    element = ElementTree.fromstring(response.text).find("Message")
    assert element is not None
    return element.text


# ---------------------------------------------------------------- flag behaviour


def test_webhook_disabled_returns_404(client, monkeypatch):
    monkeypatch.setattr(settings, "WHATSAPP_ENABLED", False)
    with patch("app.api.routes.whatsapp.generate_chat_reply") as mock_generate:
        response = client.post(WEBHOOK_URL, data=SAMPLE_FORM)
    assert response.status_code == 404
    mock_generate.assert_not_called()


def test_versioned_path_also_registered(client, enabled):
    with patch("app.api.routes.whatsapp.generate_chat_reply", return_value=("Hello", True)):
        response = client.post(VERSIONED_WEBHOOK_URL, data=SAMPLE_FORM)
    assert response.status_code == 200
    assert _message_text(response) == "Hello"


# -------------------------------------------------------------------- round trip


def test_round_trip_produces_valid_twiml(client, enabled):
    with patch("app.api.routes.whatsapp.generate_chat_reply", return_value=("Hello", True)):
        response = client.post(WEBHOOK_URL, data=SAMPLE_FORM)

    assert response.status_code == 200
    assert "xml" in response.headers["content-type"]
    assert ElementTree.fromstring(response.text).tag == "Response"
    assert _message_text(response) == "Hello"


def test_works_without_supabase_auth(client, enabled):
    from app.main import app

    app.dependency_overrides.clear()

    with patch("app.api.routes.whatsapp.generate_chat_reply", return_value=("Hello", True)):
        response = client.post(WEBHOOK_URL, data=SAMPLE_FORM)

    assert response.status_code == 200


def test_reply_is_xml_escaped(client, enabled):
    reply = "a < b & c"
    with patch("app.api.routes.whatsapp.generate_chat_reply", return_value=(reply, True)):
        response = client.post(WEBHOOK_URL, data=SAMPLE_FORM)

    assert "a &lt; b &amp; c" in response.text
    assert _message_text(response) == reply


def test_generation_failure_still_returns_twiml(client, enabled):
    with patch("app.api.routes.whatsapp.generate_chat_reply", side_effect=RuntimeError("boom")):
        response = client.post(WEBHOOK_URL, data=SAMPLE_FORM)

    assert response.status_code == 200
    assert "UdyamAI" in response.text
    ElementTree.fromstring(response.text)


def test_empty_body_answered_without_llm_call(client, enabled):
    with patch("app.api.routes.whatsapp.generate_chat_reply") as mock_generate:
        response = client.post(WEBHOOK_URL, data={"From": "whatsapp:+919999999999"})

    assert response.status_code == 200
    mock_generate.assert_not_called()
    assert _message_text(response)


# -------------------------------------------------------------- signature checks


def test_verification_off_allows_unsigned_demo(client, enabled):
    with patch("app.api.routes.whatsapp.generate_chat_reply", return_value=("Hello", True)):
        response = client.post(WEBHOOK_URL, data=SAMPLE_FORM)
    assert response.status_code == 200


def test_valid_signature_accepted(client, verifying):
    headers = {"X-Twilio-Signature": _sign(SAMPLE_FORM)}
    with patch("app.api.routes.whatsapp.generate_chat_reply", return_value=("Hello", True)):
        response = client.post(WEBHOOK_URL, data=SAMPLE_FORM, headers=headers)

    assert response.status_code == 200
    assert _message_text(response) == "Hello"


def test_invalid_signature_rejected(client, verifying):
    headers = {"X-Twilio-Signature": _sign(SAMPLE_FORM, token="wrong-token")}
    with patch("app.api.routes.whatsapp.generate_chat_reply") as mock_generate:
        response = client.post(WEBHOOK_URL, data=SAMPLE_FORM, headers=headers)

    assert response.status_code == 403
    mock_generate.assert_not_called()


def test_missing_signature_rejected_when_verifying(client, verifying):
    with patch("app.api.routes.whatsapp.generate_chat_reply") as mock_generate:
        response = client.post(WEBHOOK_URL, data=SAMPLE_FORM)

    assert response.status_code == 403
    mock_generate.assert_not_called()


def test_tampered_body_invalidates_signature(client, verifying):
    headers = {"X-Twilio-Signature": _sign(SAMPLE_FORM)}
    tampered = {**SAMPLE_FORM, "Body": "Send me your bank details"}

    with patch("app.api.routes.whatsapp.generate_chat_reply") as mock_generate:
        response = client.post(WEBHOOK_URL, data=tampered, headers=headers)

    assert response.status_code == 403
    mock_generate.assert_not_called()


def test_verification_without_auth_token_returns_503(client, enabled, monkeypatch):
    monkeypatch.setattr(settings, "WHATSAPP_VERIFY_SIGNATURE", True)
    monkeypatch.setattr(settings, "TWILIO_AUTH_TOKEN", None)

    response = client.post(WEBHOOK_URL, data=SAMPLE_FORM)

    assert response.status_code == 503


def test_configured_webhook_url_is_used_for_signing(client, verifying, monkeypatch):
    """TWILIO_WEBHOOK_URL pins the signed URL when a proxy rewrites scheme/host."""
    public_url = "https://demo.example.com/webhooks/whatsapp"
    monkeypatch.setattr(settings, "TWILIO_WEBHOOK_URL", public_url)
    headers = {"X-Twilio-Signature": _sign(SAMPLE_FORM, url=public_url)}

    with patch("app.api.routes.whatsapp.generate_chat_reply", return_value=("Hello", True)):
        response = client.post(WEBHOOK_URL, data=SAMPLE_FORM, headers=headers)

    assert response.status_code == 200


def test_forwarded_headers_reconstruct_signed_url(client, verifying):
    headers = {
        "X-Twilio-Signature": _sign(
            SAMPLE_FORM, url="https://public.example.com/webhooks/whatsapp"
        ),
        "X-Forwarded-Proto": "https",
        "X-Forwarded-Host": "public.example.com",
    }

    with patch("app.api.routes.whatsapp.generate_chat_reply", return_value=("Hello", True)):
        response = client.post(WEBHOOK_URL, data=SAMPLE_FORM, headers=headers)

    assert response.status_code == 200


# ------------------------------------------------------------------- throttling


def test_second_message_from_same_sender_is_429(client, enabled, monkeypatch):
    monkeypatch.setattr(whatsapp._sender_limiter, "requests_limit", 1)

    with patch(
        "app.api.routes.whatsapp.generate_chat_reply", return_value=("Hello", True)
    ) as mock_generate:
        first = client.post(WEBHOOK_URL, data=SAMPLE_FORM)
        second = client.post(WEBHOOK_URL, data=SAMPLE_FORM)

    assert first.status_code == 200
    assert second.status_code == 429
    assert mock_generate.call_count == 1


def test_throttle_keys_on_sender_not_ip(client, enabled, monkeypatch):
    monkeypatch.setattr(whatsapp._sender_limiter, "requests_limit", 1)

    with patch("app.api.routes.whatsapp.generate_chat_reply", return_value=("Hello", True)):
        first = client.post(WEBHOOK_URL, data=SAMPLE_FORM)
        other = client.post(WEBHOOK_URL, data={**SAMPLE_FORM, "From": "whatsapp:+918888888888"})

    assert first.status_code == 200
    assert other.status_code == 200


# -------------------------------------------------------------- MessageSid dedupe


def test_duplicate_message_sid_is_not_replied_twice(client, enabled):
    with patch(
        "app.api.routes.whatsapp.generate_chat_reply", return_value=("Hello", True)
    ) as mock_generate:
        first = client.post(WEBHOOK_URL, data=SAMPLE_FORM)
        retry = client.post(WEBHOOK_URL, data=SAMPLE_FORM)

    assert first.status_code == 200
    assert _message_text(first) == "Hello"
    # Twilio's retry gets "handled, nothing to send" so it stops retrying.
    assert retry.status_code == 200
    assert ElementTree.fromstring(retry.text).find("Message") is None
    assert mock_generate.call_count == 1


def test_sid_claim_happens_before_the_llm_call(client, enabled):
    """Even a slow generation must have claimed the SID before a retry lands."""

    def _slow_reply(**_kwargs):
        # A retry arriving while this is running must not re-enter generation.
        assert "SM1234567890abcdef" in whatsapp._sid_cache
        return ("Hello", True)

    with patch("app.api.routes.whatsapp.generate_chat_reply", side_effect=_slow_reply):
        client.post(WEBHOOK_URL, data=SAMPLE_FORM)


# The empty-body test below posts a form without MessageSid; that is also the
# shape of some Twilio status callbacks, which must keep processing normally.


def test_missing_message_sid_still_processed(client, enabled):
    with patch(
        "app.api.routes.whatsapp.generate_chat_reply", return_value=("Hello", True)
    ) as mock_generate:
        response = client.post(WEBHOOK_URL, data={"From": "whatsapp:+919999999999", "Body": "hi"})

    assert response.status_code == 200
    assert _message_text(response) == "Hello"
    assert mock_generate.call_count == 1


def test_sid_cache_evicts_expired_entries():
    from app.api.routes import whatsapp as wa

    sid = "SMexpired"
    assert wa._claim_message_sid(sid) is True
    # Age the entry past the TTL, with a fresh entry behind it so eviction runs.
    wa._sid_cache[sid] = time.monotonic() - wa._SID_TTL_SECONDS - 1
    assert wa._claim_message_sid("SMfresh") is True
    assert sid not in wa._sid_cache
    # The expired SID can be claimed again.
    assert wa._claim_message_sid(sid) is True


def test_sid_cache_is_bounded():
    from app.api.routes import whatsapp as wa

    for index in range(wa._SID_CACHE_MAX + 50):
        assert wa._claim_message_sid(f"SM{index}") is True

    assert len(wa._sid_cache) <= wa._SID_CACHE_MAX


# ---------------------------------------------------------------------- language


def test_devanagari_body_selects_hindi(client, enabled):
    form = {**SAMPLE_FORM, "Body": "पीएमईजीपी क्या है?"}
    with patch(
        "app.api.routes.whatsapp.generate_chat_reply", return_value=("नमस्ते", True)
    ) as mock_generate:
        response = client.post(WEBHOOK_URL, data=form)

    assert response.status_code == 200
    assert mock_generate.call_args.kwargs["language"] == "hi"


def test_latin_body_selects_english(client, enabled):
    with patch(
        "app.api.routes.whatsapp.generate_chat_reply", return_value=("Hello", True)
    ) as mock_generate:
        client.post(WEBHOOK_URL, data=SAMPLE_FORM)

    assert mock_generate.call_args.kwargs["language"] == "en"


# --------------------------------------------------------------------- truncation


def test_long_reply_truncated_at_sentence_boundary():
    reply = "This is a sentence. " * 200
    truncated = whatsapp._truncate(reply)

    assert len(truncated) <= whatsapp._MAX_REPLY_CHARS
    assert truncated.endswith("This is a sentence.")


def test_short_reply_is_not_truncated():
    reply = "Short and sweet."
    assert whatsapp._truncate(reply) == reply


# ------------------------------------------------------------------------ config


def test_blank_flag_env_uses_default(monkeypatch):
    """An empty `WHATSAPP_ENABLED=` placeholder must not crash startup."""
    from app.config import Settings

    monkeypatch.setenv("WHATSAPP_ENABLED", "")
    monkeypatch.setenv("WHATSAPP_VERIFY_SIGNATURE", "")

    configured = Settings(_env_file=None)

    assert configured.WHATSAPP_ENABLED is False
    assert configured.WHATSAPP_VERIFY_SIGNATURE is False


def test_blank_twilio_token_normalised_to_none(monkeypatch):
    from app.config import Settings

    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "   ")
    monkeypatch.setenv("TWILIO_WEBHOOK_URL", "")

    configured = Settings(_env_file=None)

    assert configured.TWILIO_AUTH_TOKEN is None
    assert configured.TWILIO_WEBHOOK_URL is None
