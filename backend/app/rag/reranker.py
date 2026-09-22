"""Reranker module for RAG — improves precision after broad retrieval.

Pipeline:
  retrieve candidate set → rerank → select final context

Provides:
  - ScoreBasedReranker: lightweight fallback using keyword overlap + position scoring
  - Pluggable interface for future cross-encoder rerankers

The reranker is configurable via RERANKER_TYPE in settings.
"""

from __future__ import annotations

import logging
import re
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.config import settings
from app.models.rag import Document, DocumentChunk

logger = logging.getLogger(__name__)


@dataclass
class RankedResult:
    """A reranked retrieval result."""

    chunk: DocumentChunk
    document: Document
    original_score: float
    rerank_score: float


class Reranker(ABC):
    """Abstract reranker interface — swap implementations without changing the pipeline."""

    @abstractmethod
    def rerank(
        self,
        query: str,
        candidates: list[tuple[DocumentChunk, Document, float]],
        top_k: int = 5,
    ) -> list[RankedResult]: ...


class ScoreBasedReranker(Reranker):
    """Lightweight reranker using keyword overlap, exact match bonus, and position scoring.

    No external model required — works offline and is fast.
    """

    def rerank(
        self,
        query: str,
        candidates: list[tuple[DocumentChunk, Document, float]],
        top_k: int = 5,
    ) -> list[RankedResult]:
        if not candidates:
            return []

        start = time.monotonic()
        query_lower = query.lower()
        query_terms = set(t for t in query_lower.split() if len(t) >= 3)

        # Extract important terms (numbers, percentages, scheme names)
        query_numbers = set(re.findall(r"\d+(?:\.\d+)?%?", query))
        query_upper = set(re.findall(r"\b[A-Z]{2,}\b", query))

        results: list[RankedResult] = []
        for chunk, doc, original_score in candidates:
            content_lower = chunk.content.lower()

            # 1. Keyword overlap score (0 to 1)
            if query_terms:
                overlap = sum(1 for t in query_terms if t in content_lower) / len(query_terms)
            else:
                overlap = 0.0

            # 2. Exact phrase bonus
            phrase_bonus = 0.15 if query_lower in content_lower else 0.0

            # 3. Number/percentage match bonus
            number_bonus = 0.0
            if query_numbers:
                content_numbers = set(re.findall(r"\d+(?:\.\d+)?%?", chunk.content))
                if query_numbers & content_numbers:
                    number_bonus = 0.1

            # 4. Acronym/scheme name match bonus
            acronym_bonus = 0.0
            if query_upper:
                content_upper = set(re.findall(r"\b[A-Z]{2,}\b", chunk.content))
                if query_upper & content_upper:
                    acronym_bonus = 0.1

            # 5. Freshness bonus (prefer documents with more recent effective dates)
            freshness_bonus = 0.0
            if doc.effective_from:
                # Small bonus for having a defined effective date
                freshness_bonus = 0.05

            # Combined rerank score
            rerank_score = (
                original_score * 0.5
                + overlap * 0.25
                + phrase_bonus
                + number_bonus
                + acronym_bonus
                + freshness_bonus
            )

            results.append(
                RankedResult(
                    chunk=chunk,
                    document=doc,
                    original_score=original_score,
                    rerank_score=rerank_score,
                )
            )

        # Sort by rerank score
        results.sort(key=lambda r: r.rerank_score, reverse=True)
        top_results = results[:top_k]

        latency = time.monotonic() - start
        logger.info(
            "Reranker: %d candidates → %d results in %.3fs",
            len(candidates),
            len(top_results),
            latency,
        )
        return top_results


def get_reranker() -> Reranker:
    """Return the configured reranker instance."""
    reranker_type = getattr(settings, "RERANKER_TYPE", "score_based") or "score_based"
    if reranker_type == "score_based":
        return ScoreBasedReranker()
    # Future: add cross-encoder support
    logger.warning("Unknown reranker type '%s', using score_based", reranker_type)
    return ScoreBasedReranker()
