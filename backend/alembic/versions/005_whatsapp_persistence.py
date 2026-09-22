"""WhatsApp channel persistence for conversations/messages

Adds:
- conversations.channel + conversations.channel_key (indexed together) — the
  sender identity for non-web channels (normalized WhatsApp number).
- conversations.message_sids — comma-separated handled SIDs, the dedupe key.
- messages.provider_sid — Twilio MessageSid, unique per conversation (filtered:
  NULLs are never unique) so a Twilio retry cannot insert a duplicate inbound
  row even across processes.

Revision ID: 005_whatsapp_persistence
Revises: 004_update_scheme_match_status_enum
Create Date: 2026-09-20 02:00:00.000000

"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "005_whatsapp_persistence"
down_revision = "004_update_scheme_match_status_enum"
branch_labels = None
depends_on = None

_TABLE = "conversations"


def _columns(inspector, table: str) -> set[str]:
    return {c["name"] for c in inspector.get_columns(table)}


def _indexes(inspector, table: str) -> set[str]:
    return {i["name"] for i in inspector.get_indexes(table)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # Older deploys may predate the conversations table entirely; the models'
    # create_all covers that case, so only alter what exists.
    if not inspector.has_table(_TABLE):
        return

    columns = _columns(inspector, _TABLE)

    if "channel" not in columns:
        op.add_column(_TABLE, sa.Column("channel", sa.String(), nullable=True))
    if "channel_key" not in columns:
        op.add_column(_TABLE, sa.Column("channel_key", sa.String(), nullable=True))
    if "message_sids" not in columns:
        op.add_column(_TABLE, sa.Column("message_sids", sa.String(), nullable=True))

    existing_indexes = _indexes(inspector, _TABLE)
    if "ix_conversations_channel" not in existing_indexes:
        op.create_index("ix_conversations_channel", _TABLE, ["channel"])
    if "ix_conversations_channel_key" not in existing_indexes:
        op.create_index("ix_conversations_channel_key", _TABLE, ["channel_key"])

    # messages.provider_sid + per-conversation uniqueness (NULLs exempt).
    if inspector.has_table("messages"):
        messages_columns = _columns(inspector, "messages")
        if "provider_sid" not in messages_columns:
            op.add_column("messages", sa.Column("provider_sid", sa.String(), nullable=True))

        message_indexes = _indexes(inspector, "messages")
        if "uq_messages_conversation_provider_sid" not in message_indexes:
            op.create_index(
                "uq_messages_conversation_provider_sid",
                "messages",
                ["conversation_id", "provider_sid"],
                unique=True,
            )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("messages"):
        message_indexes = _indexes(inspector, "messages")
        if "uq_messages_conversation_provider_sid" in message_indexes:
            op.drop_index("uq_messages_conversation_provider_sid", table_name="messages")
        message_columns = _columns(inspector, "messages")
        if "provider_sid" in message_columns:
            op.drop_column("messages", "provider_sid")

    if inspector.has_table(_TABLE):
        conversation_indexes = _indexes(inspector, _TABLE)
        if "ix_conversations_channel_key" in conversation_indexes:
            op.drop_index("ix_conversations_channel_key", table_name=_TABLE)
        if "ix_conversations_channel" in conversation_indexes:
            op.drop_index("ix_conversations_channel", table_name=_TABLE)
        conversation_columns = _columns(inspector, _TABLE)
        for name in ("message_sids", "channel_key", "channel"):
            if name in conversation_columns:
                op.drop_column(_TABLE, name)
