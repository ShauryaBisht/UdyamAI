"""add unique constraint to document chunks

Revision ID: 002_add_document_chunk_unique_constraint
Revises: 001_add_finance_fields
Create Date: 2026-08-31 15:13:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "002_add_document_chunk_unique_constraint"
down_revision = "001_add_finance_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add unique constraint to document_chunks table on (document_id, chunk_index)
    op.create_unique_constraint(
        "uq_document_chunk_index", "document_chunks", ["document_id", "chunk_index"]
    )


def downgrade() -> None:
    # Drop unique constraint from document_chunks table
    op.drop_constraint("uq_document_chunk_index", "document_chunks", type_="unique")
