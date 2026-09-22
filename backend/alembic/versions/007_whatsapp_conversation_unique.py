"""Add uniqueness constraints on conversations(channel, channel_key) and profiles(phone)

Adds:
- Unique constraint / index `uq_conversations_channel_channel_key` on `conversations(channel, channel_key)`.
- Unique constraint / index `uq_profiles_phone` on `profiles(phone)`.

Revision ID: 007_whatsapp_conversation_unique
Revises: 006_whatsapp_persistence
Create Date: 2026-09-21 23:25:00.000000

"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "007_whatsapp_conversation_unique"
down_revision = "006_whatsapp_persistence"
branch_labels = None
depends_on = None


def _indexes(inspector, table: str) -> set[str]:
    return {i["name"] for i in inspector.get_indexes(table)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "conversations" in tables:
        idx = _indexes(inspector, "conversations")
        if "uq_conversations_channel_channel_key" not in idx:
            op.create_index(
                "uq_conversations_channel_channel_key",
                "conversations",
                ["channel", "channel_key"],
                unique=True,
            )

    if "profiles" in tables:
        idx = _indexes(inspector, "profiles")
        if "uq_profiles_phone" not in idx:
            op.create_index(
                "uq_profiles_phone",
                "profiles",
                ["phone"],
                unique=True,
            )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "profiles" in tables:
        idx = _indexes(inspector, "profiles")
        if "uq_profiles_phone" in idx:
            op.drop_index("uq_profiles_phone", table_name="profiles")

    if "conversations" in tables:
        idx = _indexes(inspector, "conversations")
        if "uq_conversations_channel_channel_key" in idx:
            op.drop_index("uq_conversations_channel_channel_key", table_name="conversations")
