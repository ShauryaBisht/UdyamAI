"""Unit tests for hybrid search merge logic and query processing."""

from uuid import uuid4

from app.models.rag import Document, DocumentChunk
from app.rag.query_processor import _expand_query, detect_language, process_query
from app.rag.retriever import _merge_results


def test_merge_results_deduplicates_and_weights():
    doc = Document(id=uuid4(), title="Doc", source_name="Dept")
    chunk1 = DocumentChunk(id=uuid4(), document_id=doc.id, content="Text 1", chunk_index=0)
    chunk2 = DocumentChunk(id=uuid4(), document_id=doc.id, content="Text 2", chunk_index=1)

    vector_results = [(chunk1, doc, 0.90), (chunk2, doc, 0.70)]
    keyword_results = [(chunk1, doc, 0.80)]  # chunk1 matches both

    merged = _merge_results(
        vector_results=vector_results,
        keyword_results=keyword_results,
        vector_weight=0.7,
        keyword_weight=0.3,
        top_k=5,
        threshold=0.5,
    )

    assert len(merged) == 2
    # chunk1 has blended score
    assert merged[0][0].id == chunk1.id
    # chunk2 is kept because score 0.70 >= 0.50
    assert merged[1][0].id == chunk2.id


def test_merge_results_enforces_threshold():
    doc = Document(id=uuid4(), title="Doc", source_name="Dept")
    chunk_low = DocumentChunk(id=uuid4(), document_id=doc.id, content="Low", chunk_index=0)

    # Only in keyword results with low score
    keyword_results = [(chunk_low, doc, 0.40)]

    merged = _merge_results(
        vector_results=[],
        keyword_results=keyword_results,
        vector_weight=0.7,
        keyword_weight=0.3,
        top_k=5,
        threshold=0.70,
    )

    assert len(merged) == 0


def test_query_processor_script_detection():
    assert detect_language("नमस्ते") == "hi"
    assert detect_language("Hello world") == "en"


def test_query_processor_process_query_preserves_numbers_and_schemes():
    query = "What is the PMEGP subsidy of 35%?"
    processed = process_query(query)
    assert any("PMEGP" in t for t in processed.preserved_terms)
    assert any("35%" in t for t in processed.preserved_terms)


def test_query_processor_expansion():
    query = "loan anudaan"
    expanded = _expand_query(query)
    assert "subsidy" in expanded.lower() or "grant" in expanded.lower()
