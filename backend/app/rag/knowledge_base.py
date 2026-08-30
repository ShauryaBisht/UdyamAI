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


def check_document_exists(db: Session, content_hash: str) -> bool:
    """Check if a document with the given content hash has already been ingested."""
    statement = select(Document).where(Document.content_hash == content_hash)
    result = db.exec(statement).first()
    return result is not None


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

    if check_document_exists(db, content_hash):
        return None  # Skip duplicate

    # Parse page-by-page (handles errors itself)
    pages = parse_pdf(file_path)

    # Create new document record in the DB
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
    db.commit()
    db.refresh(db_doc)

    # Chunk the pages text
    chunks_data = chunk_document(
        pages=pages,
        document_id=db_doc.id,
        source_title=title,
        source_url=source_url,
        document_version=document_version,
    )

    if not chunks_data:
        return db_doc

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

    db.commit()
    return db_doc
