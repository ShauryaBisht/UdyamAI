import os
import tempfile
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from sqlmodel import Session, create_engine

from app.config import settings
from app.models.rag import Document, DocumentChunk
from app.models.scheme import Scheme
from app.rag.chunker import chunk_document
from app.rag.document_parser import (
    CorruptedPDFError,
    EmptyPDFError,
    EncryptedPDFError,
    ScannedPDFError,
    parse_pdf,
)
from app.rag.embeddings import generate_embeddings
from app.rag.knowledge_base import calculate_sha256, ingest_document

# Prevent ValueError in embeddings generation
settings.OPENAI_API_KEY = "mock-openai-key-for-testing"


# Setup an in-memory SQLite database for testing RAG SQLModels
@pytest.fixture(name="db_session")
def db_session_fixture():
    engine = create_engine("sqlite:///:memory:")
    # Create only the required tables to avoid PostGIS Geography table creation errors in SQLite
    Document.__table__.create(engine)
    Scheme.__table__.create(engine)
    DocumentChunk.__table__.create(engine)
    with Session(engine) as session:
        yield session


# Helper to create a temporary file with custom bytes
@pytest.fixture
def temp_file():
    fd, path = tempfile.mkstemp()
    with os.fdopen(fd, "wb") as f:
        f.write(b"dummy pdf contents")
    yield path
    os.remove(path)


# --- 1. Testing document_parser.py ---


@patch("app.rag.document_parser.pypdf.PdfReader")
def test_parse_pdf_success(mock_pdf_reader, temp_file):
    # Mocking standard PDF with 2 pages of text
    mock_reader = MagicMock()
    mock_reader.is_encrypted = False

    page1 = MagicMock()
    page1.extract_text.return_value = "Page 1: PMFME contribution is 10 percent."

    page2 = MagicMock()
    page2.extract_text.return_value = "Page 2: Exception list for schemes."

    mock_reader.pages = [page1, page2]
    mock_pdf_reader.return_value = mock_reader

    result = parse_pdf(temp_file)
    assert len(result) == 2
    assert result[0]["page_number"] == 1
    assert "PMFME" in result[0]["text"]
    assert result[1]["page_number"] == 2
    assert "Exception" in result[1]["text"]


def test_parse_pdf_file_not_found():
    with pytest.raises(FileNotFoundError):
        parse_pdf("non_existent_file.pdf")


def test_parse_pdf_zero_bytes():
    with tempfile.NamedTemporaryFile() as tmp:
        with pytest.raises(EmptyPDFError):
            parse_pdf(tmp.name)


@patch("app.rag.document_parser.pypdf.PdfReader")
def test_parse_pdf_encrypted(mock_pdf_reader, temp_file):
    mock_reader = MagicMock()
    mock_reader.is_encrypted = True
    mock_pdf_reader.return_value = mock_reader

    with pytest.raises(EncryptedPDFError):
        parse_pdf(temp_file)


@patch("app.rag.document_parser.pypdf.PdfReader")
def test_parse_pdf_corrupted(mock_pdf_reader, temp_file):
    mock_pdf_reader.side_effect = Exception("Corrupt headers")

    with pytest.raises(CorruptedPDFError):
        parse_pdf(temp_file)


@patch("app.rag.document_parser.pypdf.PdfReader")
def test_parse_pdf_empty_pages(mock_pdf_reader, temp_file):
    mock_reader = MagicMock()
    mock_reader.is_encrypted = False
    mock_reader.pages = []
    mock_pdf_reader.return_value = mock_reader

    with pytest.raises(EmptyPDFError):
        parse_pdf(temp_file)


@patch("app.rag.document_parser.pypdf.PdfReader")
def test_parse_pdf_scanned_image_only(mock_pdf_reader, temp_file):
    mock_reader = MagicMock()
    mock_reader.is_encrypted = False

    page1 = MagicMock()
    page1.extract_text.return_value = ""  # Scanned PDF returns empty text

    mock_reader.pages = [page1]
    mock_pdf_reader.return_value = mock_reader

    with pytest.raises(ScannedPDFError):
        parse_pdf(temp_file)


# --- 2. Testing chunker.py ---


def test_sliding_window_chunking():
    pages = [
        {"page_number": 1, "text": "This is a sentence. Page 1 metadata content."},
        {"page_number": 2, "text": "Another page text here. Exception is handled."},
    ]
    doc_id = uuid4()

    # 20 chars size, 5 chars overlap
    chunks = chunk_document(
        pages=pages,
        document_id=doc_id,
        source_title="Test Document",
        source_url="http://test.com",
        document_version="1.0",
        chunk_size=20,
        chunk_overlap=5,
    )

    assert len(chunks) > 0
    assert chunks[0]["document_id"] == doc_id
    assert chunks[0]["source_title"] == "Test Document"
    assert chunks[0]["source_url"] == "http://test.com"
    assert chunks[0]["document_version"] == "1.0"

    # Validate sliding window increment
    assert chunks[0]["chunk_index"] == 0
    assert chunks[1]["chunk_index"] == 1


def test_chunker_invalid_parameters():
    pages = [{"page_number": 1, "text": "Text"}]
    with pytest.raises(ValueError):
        chunk_document(pages, uuid4(), "Title", chunk_size=-5)
    with pytest.raises(ValueError):
        chunk_document(pages, uuid4(), "Title", chunk_size=10, chunk_overlap=15)


# --- 3. Testing embeddings.py API Success & Failure ---


@patch("app.rag.embeddings.get_openai_client")
def test_generate_embeddings_success(mock_get_client):
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_data = [MagicMock(embedding=[0.1] * 1536), MagicMock(embedding=[0.2] * 1536)]
    mock_response.data = mock_data
    mock_client.embeddings.create.return_value = mock_response
    mock_get_client.return_value = mock_client

    embeddings = generate_embeddings(["Text 1", "Text 2"])
    assert len(embeddings) == 2
    assert len(embeddings[0]) == 1536
    assert embeddings[0][0] == 0.1
    assert embeddings[1][0] == 0.2


@patch("app.rag.embeddings.get_openai_client")
def test_generate_embeddings_failure(mock_get_client):
    mock_client = MagicMock()
    mock_client.embeddings.create.side_effect = Exception("OpenAI API Key Invalid")
    mock_get_client.return_value = mock_client

    with pytest.raises(Exception) as excinfo:
        generate_embeddings(["Text"])
    assert "API Key Invalid" in str(excinfo.value)


# --- 4. Testing knowledge_base.py Ingestion & Deduplication ---


@patch("app.rag.knowledge_base.parse_pdf")
@patch("app.rag.knowledge_base.generate_embeddings")
def test_ingest_document_success(mock_embed, mock_parse, db_session, temp_file):
    # Mock parser output
    mock_parse.return_value = [{"page_number": 1, "text": "PMFME scheme loans eligibility rule."}]
    # Mock embedding output (1536 dimensions)
    mock_embed.return_value = [[0.05] * 1536]

    doc = ingest_document(
        db=db_session,
        file_path=temp_file,
        title="PMFME Guidelines",
        source_name="MoFPI",
        source_url="http://test-url.com",
        document_version="1.0",
    )

    assert doc is not None
    assert doc.title == "PMFME Guidelines"
    assert doc.source_url == "http://test-url.com"

    # Assert DB persistence
    db_doc = db_session.get(Document, doc.id)
    assert db_doc is not None
    assert len(db_doc.chunks) == 1
    assert db_doc.chunks[0].page_number == 1
    assert db_doc.chunks[0].content == "PMFME scheme loans eligibility rule."
    assert db_doc.chunks[0].embedding is not None


@patch("app.rag.knowledge_base.parse_pdf")
@patch("app.rag.knowledge_base.generate_embeddings")
def test_ingest_document_deduplication(mock_embed, mock_parse, db_session, temp_file):
    # Register document once in database
    content_hash = calculate_sha256(temp_file)
    existing_doc = Document(
        title="Already Ingested Document", content_hash=content_hash, file_path=temp_file
    )
    db_session.add(existing_doc)
    db_session.commit()

    # Attempting to ingest again
    result = ingest_document(
        db=db_session, file_path=temp_file, title="Duplicate Ingestion Attempt"
    )

    # Check that duplication check skipped the file
    assert result is None
    assert mock_parse.call_count == 0
