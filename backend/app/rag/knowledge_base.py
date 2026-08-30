import hashlib
from uuid import UUID

from sqlmodel import Session, select

from app.models.rag import Document, DocumentChunk
from app.rag.chunker import chunk_document
from app.rag.document_parser import parse_pdf
from app.rag.embeddings import generate_embeddings


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
    content_hash = calculate_sha256(file_path)

    # 1. Parse the PDF page-by-page first to generate chunk candidate data
    pages = parse_pdf(file_path)

    # 2. Query the document by content hash
    statement = select(Document).where(Document.content_hash == content_hash)
    existing_doc = db.exec(statement).first()

    db_doc = None

    try:
        if existing_doc:
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
                return None

            # If chunk count doesn't match expected or is 0, we treat it as incomplete and rebuild
            db_doc = existing_doc

            # Clean up all existing chunks associated with this document ID
            db_doc.chunks = []
            db.add(db_doc)
            # Flush changes so the deletion executes in the transaction
            db.flush()
        else:
            # If completely new document
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

            # Store chunks along with their vector embeddings in pgvector
            for i, chunk in enumerate(chunks_data):
                db_chunk = DocumentChunk(
                    document_id=db_doc.id,
                    scheme_id=scheme_id,
                    chunk_index=chunk["chunk_index"],
                    content=chunk["content"],
                    page_number=chunk["page_number"],
                    section_title=chunk["section_heading"],
                    embedding=embeddings[i] if i < len(embeddings) else None,
                )
                db.add(db_chunk)

        # Commit everything atomically at the end
        db.commit()
        db.refresh(db_doc)
        return db_doc

    except Exception as e:
        db.rollback()
        raise e
