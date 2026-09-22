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

from alembic import op

# revision identifiers
revision = "005_add_hnsw_vector_index"
down_revision = "004_update_scheme_match_status_enum"
branch_labels = None
depends_on = None


def upgrade():
    # Ensure pgvector extension exists
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

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


def downgrade():
    op.execute("DROP INDEX IF EXISTS idx_document_chunks_embedding_hnsw")
