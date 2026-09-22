"""Unit tests for the RAG reranker module."""

from uuid import uuid4

from app.models.rag import Document, DocumentChunk
from app.rag.reranker import ScoreBasedReranker, get_reranker


def test_score_based_reranker_empty():
    reranker = ScoreBasedReranker()
    results = reranker.rerank("query", [])
    assert results == []


def test_score_based_reranker_prioritizes_exact_match_and_acronym():
    reranker = ScoreBasedReranker()
    doc = Document(id=uuid4(), title="Test Doc", source_name="Dept")

    chunk_a = DocumentChunk(
        id=uuid4(),
        document_id=doc.id,
        content="General financial assistance is available for entrepreneurs.",
        chunk_index=0,
    )
    chunk_b = DocumentChunk(
        id=uuid4(),
        document_id=doc.id,
        content="The PMEGP scheme offers 35% subsidy for manufacturing units.",
        chunk_index=1,
    )

    candidates = [
        (chunk_a, doc, 0.85),
        (chunk_b, doc, 0.80),
    ]

    results = reranker.rerank("What is the PMEGP 35% subsidy?", candidates, top_k=2)
    assert len(results) == 2
    # chunk_b matches acronym PMEGP and number 35%, so it should be promoted to rank 1
    assert results[0].chunk.id == chunk_b.id
    assert results[0].rerank_score > results[1].rerank_score


def test_get_reranker_factory():
    reranker = get_reranker()
    assert isinstance(reranker, ScoreBasedReranker)
