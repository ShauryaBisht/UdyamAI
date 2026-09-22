"""Add HNSW vector index for pgvector cosine similarity search.

Revision ID: 005_add_hnsw_vector_index
Revises: 004_update_scheme_match_status_enum

Uses HNSW index (preferred over IVFFlat) because:
- HNSW does not require a separate training/build step
- Better query performance for the expected document count (<100K chunks)
- Supports concurrent inserts without index rebuilds
- vector_cosine_ops matches the <=> operator used in retrieval

Tuning parameters:
- m=16: number of bi-directional links per element (default 16, good for recall/speed balance)
- ef_construction=64: size of dynamic candidate list during index construction
  Higher values improve recall at the cost of build time
"""

import logging

from alembic import op

logger = logging.getLogger("alembic.runtime.migration")

# revision identifiers
revision = "005_add_hnsw_vector_index"
down_revision = "004_update_scheme_match_status_enum"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    if bind is not None and bind.dialect.name == "postgresql":
        try:
            # Ensure pgvector extension exists if user has privileges
            op.execute("CREATE EXTENSION IF NOT EXISTS vector")
        except Exception as exc:
            logger.warning(
                "Could not execute CREATE EXTENSION IF NOT EXISTS vector: %s. Proceeding assuming extension is pre-installed.",
                exc,
            )

        try:
            # Create HNSW index for cosine similarity search
            # Uses vector_cosine_ops to match the <=> operator in retrieval queries
            op.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw
                ON document_chunks
                USING hnsw (embedding vector_cosine_ops)
                WITH (m = 16, ef_construction = 64)
                """
            )
        except Exception as exc:
            logger.warning(
                "Could not create HNSW vector index on document_chunks (pgvector <0.5 or missing extension): %s. Retrieval will use table-scan fallback.",
                exc,
            )


def downgrade():
    bind = op.get_bind()
    if bind is not None and bind.dialect.name == "postgresql":
        try:
            op.execute("DROP INDEX IF EXISTS idx_document_chunks_embedding_hnsw")
        except Exception as exc:
            logger.warning("Could not drop HNSW vector index: %s", exc)
