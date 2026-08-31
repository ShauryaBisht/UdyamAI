import logging
from uuid import UUID

from sqlmodel import Session

from app.models.rag import Document
from app.rag.knowledge_base import ingest_document
from app.rag.retriever import retrieve_evidence
from app.schemas.rag import RAGQueryRequest, RAGQueryResponse

logger = logging.getLogger(__name__)


def load_document(
    db: Session,
    file_path: str,
    title: str,
    scheme_id: UUID | None = None,
    source_name: str = "Official Department",
    source_url: str | None = None,
    document_type: str = "scheme_guideline",
    language: str = "hi",
    document_version: str | None = None,
) -> Document | None:
    """
    Convenience loader function that ingests a PDF document into the RAG knowledge base.
    Parses PDF, chunks text, generates vector embeddings, and persists to pgvector database.

    Args:
        db: Active SQLModel database session.
        file_path: Absolute or relative local path to PDF file.
        title: Document title.
        scheme_id: Optional scheme UUID.
        source_name: Official publisher or department name.
        source_url: Reference URL for source document.
        document_type: Category of document (e.g. scheme_guideline).
        language: ISO language code (default 'hi').
        document_version: Version identifier string.

    Returns:
        Ingested Document model, or None if skipped (e.g., duplicate hash).
    """
    logger.info(f"Loading document via document_loader: '{title}' from {file_path}")
    return ingest_document(
        db=db,
        file_path=file_path,
        title=title,
        scheme_id=scheme_id,
        source_name=source_name,
        source_url=source_url,
        document_type=document_type,
        language=language,
        document_version=document_version,
    )


def query_rag_pipeline(
    db: Session,
    query: str | RAGQueryRequest,
    scheme_id: UUID | None = None,
    language: str | None = None,
    limit: int | None = None,
    score_threshold: float | None = None,
) -> RAGQueryResponse:
    """
    Convenience pipeline function executing end-to-end RAG evidence retrieval and citation formatting.

    Args:
        db: Active SQLModel database session.
        query: Search query or RAGQueryRequest model.
        scheme_id: Optional scheme filter.
        language: Optional language filter.
        limit: Max top_k evidence items to retrieve.
        score_threshold: Minimum similarity threshold.

    Returns:
        RAGQueryResponse containing status and verified citations.
    """
    logger.info("Executing end-to-end RAG query pipeline...")
    return retrieve_evidence(
        db=db,
        query=query,
        scheme_id=scheme_id,
        language=language,
        limit=limit,
        score_threshold=score_threshold,
    )
