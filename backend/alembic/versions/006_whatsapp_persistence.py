"""WhatsApp channel persistence for conversations/messages

Adds:
- conversations.channel + conversations.channel_key (indexed together) — the
  sender identity for non-web channels (normalized WhatsApp number).
- conversations.message_sids — comma-separated handled SIDs, the dedupe key.
- messages.provider_sid — Twilio MessageSid, unique per conversation (filtered:
  NULLs are never unique) so a Twilio retry cannot insert a duplicate inbound
  row even across processes.

Revision ID: 006_whatsapp_persistence
Revises: 005_add_hnsw_vector_index
Create Date: 2026-09-20 02:00:00.000000

"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "006_whatsapp_persistence"
down_revision = "005_add_hnsw_vector_index"
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
    tables = set(inspector.get_table_names())

    if _TABLE in tables:
        cols = _columns(inspector, _TABLE)
        if "channel" not in cols:
            op.add_column(
                _TABLE,
                sa.Column("channel", sa.String(), nullable=False, server_default="web"),
            )
        if "channel_key" not in cols:
            op.add_column(_TABLE, sa.Column("channel_key", sa.String(), nullable=True))
        if "message_sids" not in cols:
            op.add_column(_TABLE, sa.Column("message_sids", sa.Text(), nullable=True))

        idx = _indexes(inspector, _TABLE)
        if "ix_conversations_channel_channel_key" not in idx:
            op.create_index(
                "ix_conversations_channel_channel_key",
                _TABLE,
                ["channel", "channel_key"],
            )

    if "messages" in tables:
        msg_cols = _columns(inspector, "messages")
        if "provider_sid" not in msg_cols:
            op.add_column("messages", sa.Column("provider_sid", sa.String(), nullable=True))

        msg_idx = _indexes(inspector, "messages")
        if "ix_messages_provider_sid" not in msg_idx:
            op.create_index(
                "ix_messages_provider_sid",
                "messages",
                ["provider_sid"],
            )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "messages" in tables:
        msg_idx = _indexes(inspector, "messages")
        if "ix_messages_provider_sid" in msg_idx:
            op.drop_index("ix_messages_provider_sid", table_name="messages")
        msg_cols = _columns(inspector, "messages")
        if "provider_sid" in msg_cols:
            op.drop_column("messages", "provider_sid")

    if _TABLE in tables:
        idx = _indexes(inspector, _TABLE)
        if "ix_conversations_channel_channel_key" in idx:
            op.drop_index("ix_conversations_channel_channel_key", table_name=_TABLE)
        cols = _columns(inspector, _TABLE)
        for col in ("message_sids", "channel_key", "channel"):
            if col in cols:
                op.drop_column(_TABLE, col)
