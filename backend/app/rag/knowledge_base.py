import hashlib
import logging
from uuid import UUID

from sqlalchemy import delete
from sqlmodel import Session, select

from app.config import settings
from app.models.rag import Document, DocumentChunk
from app.rag.chunker import chunk_document
from app.rag.document_parser import parse_pdf
from app.rag.embeddings import generate_embeddings

logger = logging.getLogger(__name__)


def calculate_sha256(file_path: str) -> str:
    """Calculate the SHA-256 checksum of a local file."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            sha256.update(chunk)
    return sha256.hexdigest()


def ingest_document(
    db: Session,
    file_path: str,
    title: str,
    scheme_id: UUID | None = None,
    source_name: str = "Unknown",
    source_url: str | None = None,
    document_type: str = "scheme_guideline",
    language: str = "hi",
    document_version: str | None = None,
) -> Document | None:
    """
    Orchestrates the ingestion pipeline for a PDF document.
    Calculates SHA-256 hash to skip duplicates. If new, parses PDF,
    creates chunks, generates vector embeddings, and stores them in PostgreSQL.
    """
    # Pre-flight check: validate OPENAI_API_KEY upfront
    if not settings.OPENAI_API_KEY:
        logger.error("Ingestion aborted: OPENAI_API_KEY environment variable is not set.")
        raise ValueError("OPENAI_API_KEY environment variable is not set")

    logger.info(f"Initiating ingestion pipeline for document '{title}' (file: {file_path})")

    content_hash = calculate_sha256(file_path)

    # 1. Parse the PDF page-by-page first to generate chunk candidate data
    pages = parse_pdf(file_path)
    logger.info(f"PDF parsed. Found {len(pages)} pages.")

    db_doc = None

    try:
        # 2. Query the document by content hash using row-level locking (with_for_update)
        statement = select(Document).where(Document.content_hash == content_hash).with_for_update()
        existing_doc = db.exec(statement).first()

        if existing_doc:
            logger.info(
                f"Found existing document with content hash: {content_hash}. Verifying completeness..."
            )

            # Query existing chunks count in database
            chunks_stmt = select(DocumentChunk).where(DocumentChunk.document_id == existing_doc.id)
            existing_chunks = db.exec(chunks_stmt).all()

            # Generate chunks to see how many we expect
            chunks_data = chunk_document(
                pages=pages,
                document_id=existing_doc.id,
                source_title=title,
                source_url=source_url,
                document_version=document_version,
            )

            # Verify completeness: does chunk count match expected?
            if len(chunks_data) > 0 and len(existing_chunks) == len(chunks_data):
                # Genuinely complete! Return None to indicate skipped
                logger.info(
                    f"Document '{title}' ({content_hash}) is already complete with {len(existing_chunks)} chunks. Skipping ingestion."
                )
                return None

            # If chunk count doesn't match expected or is 0, we treat it as incomplete and rebuild
            logger.warning(
                f"Document '{title}' ({content_hash}) is incomplete. "
                f"Expected: {len(chunks_data)} chunks, Found in DB: {len(existing_chunks)} chunks. "
                f"Wiping existing chunks and rebuilding..."
            )
            db_doc = existing_doc

            # Explicitly delete all existing DocumentChunks for this document
            db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == existing_doc.id))
            # Clear the relationship in session memory to maintain consistency
            db_doc.chunks = []
            # Flush changes so the deletion executes in the transaction
            db.flush()
        else:
            # If completely new document
            logger.info(f"Ingesting completely new document: '{title}' ({content_hash})")
            db_doc = Document(
                title=title,
                source_name=source_name,
                source_url=source_url,
                document_type=document_type,
                language=language,
                file_path=file_path,
                content_hash=content_hash,
                active=True,
            )
            db.add(db_doc)
            # Flush to get the generated UUID without committing
            db.flush()

        # 3. Chunk the pages text
        chunks_data = chunk_document(
            pages=pages,
            document_id=db_doc.id,
            source_title=title,
            source_url=source_url,
            document_version=document_version,
        )

        if chunks_data:
            # Extract contents for batch embedding generation
            texts = [chunk["content"] for chunk in chunks_data]
            embeddings = generate_embeddings(texts)

            # Ensure embedding count exactly matches chunk count
            if len(embeddings) != len(chunks_data):
                logger.error(
                    f"Embedding count mismatch. Generated {len(embeddings)} embeddings for {len(chunks_data)} chunks."
                )
                raise ValueError(
                    f"Embedding count mismatch. Expected {len(chunks_data)} embeddings, "
                    f"but got {len(embeddings)}."
                )

            # Store chunks along with their vector embeddings in pgvector
            logger.info(f"Storing {len(chunks_data)} chunks in database...")
            for i, chunk in enumerate(chunks_data):
                db_chunk = DocumentChunk(
                    document_id=db_doc.id,
                    scheme_id=scheme_id,
                    chunk_index=chunk["chunk_index"],
                    content=chunk["content"],
                    page_number=chunk["page_number"],
                    section_title=chunk["section_heading"],
                    embedding=embeddings[i],
                )
                db.add(db_chunk)

        # Commit everything atomically at the end
        db.commit()
        db.refresh(db_doc)
        logger.info(f"Successfully ingested and committed document '{title}' (ID: {db_doc.id})")
        return db_doc

    except Exception as e:
        logger.error(
            f"Error during ingestion of '{title}' (file: {file_path}): {str(e)}", exc_info=True
        )
        db.rollback()
        raise e
