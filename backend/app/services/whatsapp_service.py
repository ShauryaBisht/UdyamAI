"""DB persistence for the WhatsApp channel.

Everything here is fault-contained: the webhook must keep replying with TwiML
even when the database is unreachable, so callers log failures instead of
raising. Claiming is the exception: a lost claim is a *positive* signal that
changes the response body, not an error. :func:`claim_message_sid` returns
``False`` for a Twilio retry, and :func:`claim_inbound` returns ``None`` when
another worker got there first — the caller must then stay silent, because
replying would deliver a second WhatsApp message for a message that has already
been answered.

The claim runs **before** the LLM call, and it is the inbound message insert
itself: one atomic statement, so exactly one worker can own a ``message_sid`` no
matter how many pass the cheaper checks first. A worker that loses finds out here
and never pays for a reply it could not deliver.

Design notes
------------
- Only **registered** senders are persisted. A number matching no
  ``profiles.phone`` gets a signup prompt from the webhook and no rows at all, so
  there are no guest profiles to create, constrain or clean up. That is also what
  lets ``Conversation.user_id`` stay NOT NULL.
- A conversation is keyed on the profile rather than on the phone-number string:
  ``profiles.phone`` is kept current by the Supabase trigger, and a number change
  must not split a user's history.
- ``channel_key`` is the normalized E.164 number (no ``whatsapp:`` prefix), so
  ``whatsapp:+91 99999 99999`` and ``+919999999999`` resolve to one sender.
- The per-conversation list in ``conversations.message_sids`` is capped; the
  authoritative cross-process dedupe is the unique index on
  ``messages(conversation_id, provider_sid)``.
"""

from __future__ import annotations

import logging
import re
from collections.abc import Callable
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.models.ai import Conversation, Message
from app.models.user import Profile
from app.schemas.chat import ChatTurn

logger = logging.getLogger(__name__)

_CHANNEL = "whatsapp"

_MAX_SIDS_PER_CONVERSATION = 50
# How many recent turns to replay to the LLM (chat.py keeps its own cap of 8).
_HISTORY_LIMIT = 8

_session_factory: Callable[[], Session] | None = None


def set_session_factory(factory: Callable[[], Session] | None) -> None:
    """Bind the DB. Wired once at app startup to ``Session(get_engine)``.

    Kept as an injector rather than a direct import so the module (and every
    route test) can run without a database — ``get_session_factory()`` then
    returns ``None`` and the webhook simply skips persistence.
    """
    global _session_factory
    _session_factory = factory


def get_session_factory() -> Callable[[], Session] | None:
    return _session_factory


def normalize_phone(raw: str | None) -> str | None:
    """Normalize a Twilio sender (or bare E.164) to ``+<digits>``.

    Strips the ``whatsapp:`` channel prefix and everything but digits and a
    leading ``+``. Returns ``None`` when nothing usable remains, so callers
    can fall back to a raw-string key rather than crashing.
    """
    if not raw:
        return None

    digits = re.sub(r"[^0-9+]", "", raw)
    if not digits or digits == "+":
        return None
    if not digits.startswith("+"):
        digits = f"+{digits}"
    return digits


def find_profile_by_phone(session: Session, channel_key: str) -> Profile | None:
    """The registered profile for a normalized number, if one exists.

    Matches exact E.164, as well as stripped national 10-digit numbers (e.g.
    ``+918755835268`` matching ``8755835268`` or ``+918755835268``).
    """
    candidates = [channel_key]
    digits_only = re.sub(r"[^0-9]", "", channel_key)
    if digits_only:
        candidates.append(digits_only)
        if len(digits_only) == 12 and digits_only.startswith("91"):
            # 10-digit national number
            national = digits_only[2:]
            candidates.extend([national, f"+{national}"])
        elif len(digits_only) == 10:
            candidates.extend([f"+91{digits_only}", f"91{digits_only}"])

    return session.exec(select(Profile).where(Profile.phone.in_(candidates))).first()


def find_or_create_conversation(
    session: Session, profile: Profile, channel_key: str
) -> Conversation:
    """Find-or-create the one WhatsApp conversation for a registered sender."""
    conversation = session.exec(
        select(Conversation).where(
            Conversation.channel == _CHANNEL,
            Conversation.user_id == profile.id,
        )
    ).first()
    if conversation:
        return conversation

    conversation = Conversation(
        user_id=profile.id,
        channel=_CHANNEL,
        channel_key=channel_key,
        message_sids="",
    )
    session.add(conversation)
    try:
        session.flush()
        return conversation
    except IntegrityError:
        session.rollback()
        # Another worker won the race to create the conversation
        existing = session.exec(
            select(Conversation).where(
                Conversation.channel == _CHANNEL,
                Conversation.user_id == profile.id,
            )
        ).first()
        if existing:
            return existing
        existing_key = session.exec(
            select(Conversation).where(
                Conversation.channel == _CHANNEL,
                Conversation.channel_key == channel_key,
            )
        ).first()
        if existing_key:
            return existing_key
        raise


def _sid_list(conversation: Conversation) -> list[str]:
    return [sid for sid in (conversation.message_sids or "").split(",") if sid]


def claim_message_sid(session: Session, conversation: Conversation, message_sid: str) -> bool:
    """Claim ``message_sid`` for ``conversation``; ``False`` means already seen.

    Two layers:
    1. the in-conversation list (fast path, capped at
       ``_MAX_SIDS_PER_CONVERSATION``),
    2. a SELECT on ``messages.provider_sid`` — catches anything older than the
       cap window in the same process *and* retries handled by another worker.

    The unique index on ``(conversation_id, provider_sid)`` is the final
    backstop for the race the SELECT cannot close (two workers claiming the
    same new SID simultaneously): the losing insert raises, the transaction
    rolls back, and the caller treats it as a duplicate.
    """
    if not message_sid:
        return True

    if message_sid in _sid_list(conversation):
        return False

    seen = session.exec(
        select(Message.id).where(
            Message.conversation_id == conversation.id,
            Message.provider_sid == message_sid,
        )
    ).first()
    if seen:
        return False

    kept = _sid_list(conversation)[-(_MAX_SIDS_PER_CONVERSATION - 1) :]
    conversation.message_sids = ",".join([*kept, message_sid])
    conversation.updated_at = datetime.now(timezone.utc)
    session.add(conversation)
    session.flush()
    return True


def load_history(
    session: Session, conversation_id: UUID, exclude_id: UUID | None = None
) -> list[ChatTurn]:
    """Last ``_HISTORY_LIMIT`` turns, oldest first, as chat-ready turns.

    Filters out invalid roles (e.g. system/tool) and empty messages so malformed
    rows cannot trigger validation errors or disrupt chat generation.

    ``exclude_id`` skips a row the caller has already accounted for: the inbound
    message is stored by :func:`claim_inbound` before generation, so without this
    the current question would be replayed as its own history.
    """
    statement = select(Message).where(Message.conversation_id == conversation_id)
    if exclude_id is not None:
        statement = statement.where(Message.id != exclude_id)
    messages = session.exec(
        statement.order_by(Message.created_at.desc(), Message.id.desc()).limit(_HISTORY_LIMIT * 2)
    ).all()
    turns: list[ChatTurn] = []
    for m in reversed(messages):
        if m.role not in ("user", "assistant"):
            continue
        content = (m.content or "").strip()
        if not content:
            continue
        try:
            turns.append(ChatTurn(role=m.role, content=content))
        except Exception:
            continue
    return turns[-_HISTORY_LIMIT:]


def delete_conversation_history(session: Session, profile_id: UUID, channel: str = _CHANNEL) -> int:
    """Delete all conversations and messages for a profile on a given channel.

    Returns the number of deleted messages.
    """
    conversations = session.exec(
        select(Conversation).where(
            Conversation.user_id == profile_id,
            Conversation.channel == channel,
        )
    ).all()
    if not conversations:
        return 0

    deleted_messages = 0
    for conv in conversations:
        messages = session.exec(select(Message).where(Message.conversation_id == conv.id)).all()
        deleted_messages += len(messages)
        for msg in messages:
            session.delete(msg)
        session.delete(conv)
    session.commit()
    return deleted_messages


def claim_inbound(
    session: Session, conversation: Conversation, user_text: str, message_sid: str | None
) -> UUID | None:
    """Claim ``message_sid`` by storing the inbound message; ``None`` if taken.

    This is the authoritative claim and it is deliberately the *insert* of the
    inbound row: a single atomic statement, so it decides the race that the cheaper
    checks in :func:`claim_message_sid` cannot. Two workers can both find no trace
    of a SID and both append it to ``conversations.message_sids``, but only one can
    insert this row past the unique index on ``(conversation_id, provider_sid)``.

    Callers run this **before** generating a reply, so the loser bails out here
    instead of spending an LLM call on an answer it is not allowed to send. The row
    doubles as the in-progress marker: it is stored before the reply exists.

    Returns the new message id (so the caller can keep it out of the replayed
    history), or ``None`` when another worker already owns the SID.
    """
    message = Message(
        conversation_id=conversation.id,
        role="user",
        content=user_text,
        provider_sid=message_sid or None,
    )
    # ``default_factory`` has already populated the id; capture it before the commit
    # expires the instance, so no refresh query is needed to read it back.
    message_id = message.id
    session.add(message)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        logger.info("Lost the WhatsApp dedupe race (provider_sid=%s)", message_sid)
        return None
    return message_id


def save_reply(session: Session, conversation_id: UUID, assistant_text: str) -> None:
    """Append the assistant reply to an already-claimed exchange and commit.

    The inbound row was stored by :func:`claim_inbound` before generation, so this
    adds only the reply. It carries no ``provider_sid`` and therefore cannot collide
    with the dedupe index — ownership was settled at claim time, which is also why
    the conversation is identified by id here rather than looked up again.
    """
    session.add(Message(conversation_id=conversation_id, role="assistant", content=assistant_text))
    session.commit()
