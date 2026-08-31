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
    Decoupled design: remote API calls are executed outside database transactions.
    """
    # Pre-flight check: validate OPENAI_API_KEY upfront
    if not settings.OPENAI_API_KEY:
        logger.error("Ingestion aborted: OPENAI_API_KEY environment variable is not set.")
        raise ValueError("OPENAI_API_KEY environment variable is not set")

    logger.info(f"Initiating ingestion pipeline for document '{title}' (file: {file_path})")

    content_hash = calculate_sha256(file_path)

    # 1. Parse the PDF page-by-page (no DB transaction)
    pages = parse_pdf(file_path)
    logger.info(f"PDF parsed. Found {len(pages)} pages.")

    doc_id = None
    is_incomplete_recovery = False

    # 2. First short DB transaction: check existence, completeness, and insert/update Document entry
    try:
        # Query the document by content hash using row-level locking (with_for_update)
        statement = select(Document).where(Document.content_hash == content_hash).with_for_update()
        existing_doc = db.exec(statement).first()

        # Temporary UUID for count estimation
        temp_id = existing_doc.id if existing_doc else UUID("00000000-0000-0000-0000-000000000000")
        expected_chunks = chunk_document(
            pages=pages,
            document_id=temp_id,
            source_title=title,
            source_url=source_url,
            document_version=document_version,
        )
        expected_count = len(expected_chunks)

        if existing_doc:
            doc_id = existing_doc.id
            chunks_stmt = select(DocumentChunk).where(DocumentChunk.document_id == existing_doc.id)
            existing_chunks = db.exec(chunks_stmt).all()
            existing_chunks_count = len(existing_chunks)

            # Verify completeness: does chunk count match expected?
            if expected_count > 0 and existing_chunks_count == expected_count:
                logger.info(
                    f"Document '{title}' ({content_hash}) is already complete with {existing_chunks_count} chunks. Skipping ingestion."
                )
                db.rollback()  # Release row locks safely
                return None

            is_incomplete_recovery = True
            logger.warning(
                f"Document '{title}' ({content_hash}) is incomplete. "
                f"Expected: {expected_count} chunks, Found in DB: {existing_chunks_count} chunks. "
                f"Preparing for rebuild..."
            )
            # Update fields in recovery case
            existing_doc.title = title
            existing_doc.source_name = source_name
            existing_doc.source_url = source_url
            existing_doc.document_type = document_type
            existing_doc.language = language
            existing_doc.file_path = file_path
            db.add(existing_doc)
        else:
            logger.info(f"Ingesting completely new document: '{title}' ({content_hash})")
            new_doc = Document(
                title=title,
                source_name=source_name,
                source_url=source_url,
                document_type=document_type,
                language=language,
                file_path=file_path,
                content_hash=content_hash,
                active=True,
            )
            db.add(new_doc)
            db.flush()  # Populate generated ID
            doc_id = new_doc.id

        db.commit()  # End first short transaction & release locks
    except Exception as e:
        logger.error(f"Error during first transaction metadata initialization: {str(e)}")
        db.rollback()
        raise e

    # 3. Generate chunks data (outside DB transaction)
    chunks_data = chunk_document(
        pages=pages,
        document_id=doc_id,
        source_title=title,
        source_url=source_url,
        document_version=document_version,
    )

    # 4. Generate embeddings via remote OpenAI API (outside DB transaction)
    embeddings = []
    if chunks_data:
        texts = [chunk["content"] for chunk in chunks_data]
        embeddings = generate_embeddings(texts)

        if len(embeddings) != len(chunks_data):
            logger.error(
                f"Embedding count mismatch. Generated {len(embeddings)} embeddings for {len(chunks_data)} chunks."
            )
            raise ValueError(
                f"Embedding count mismatch. Expected {len(chunks_data)} embeddings, "
                f"but got {len(embeddings)}."
            )

    # 5. Second short DB transaction: delete old chunks (if recovery) and persist new chunks & embeddings
    try:
        if is_incomplete_recovery:
            logger.info(f"Rebuild mode: explicitly deleting old chunks for document {doc_id}")
            db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == doc_id))
            db.flush()

        if chunks_data:
            logger.info(f"Storing {len(chunks_data)} chunks in database...")
            for i, chunk in enumerate(chunks_data):
                db_chunk = DocumentChunk(
                    document_id=doc_id,
                    scheme_id=scheme_id,
                    chunk_index=chunk["chunk_index"],
                    content=chunk["content"],
                    page_number=chunk["page_number"],
                    section_title=chunk["section_heading"],
                    embedding=embeddings[i],
                )
                db.add(db_chunk)

        db.commit()  # End second short transaction
        logger.info(f"Successfully ingested and committed document '{title}' (ID: {doc_id})")
    except Exception as e:
        logger.error(f"Error during second transaction chunk storage: {str(e)}")
        db.rollback()
        raise e

    # Re-fetch and return the complete populated Document
    db_doc = db.get(Document, doc_id)
    if db_doc:
        db.refresh(db_doc)
    return db_doc
