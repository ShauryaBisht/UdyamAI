import logging
import re
from typing import Any

from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.models.scheme import Scheme
from app.rag.retriever import retrieve_evidence
from app.schemas.rag import RAGQueryResponse

logger = logging.getLogger(__name__)


def _is_metric_in_text(metric: str, text: str) -> bool:
    """Uses regex word boundaries to check if metric string is in text without false substring matches."""
    if not metric or not text:
        return False
    pattern = r"\b" + re.escape(metric.strip()) + r"\b"
    return bool(re.search(pattern, text, re.IGNORECASE))


class QueryEvaluationDetail(BaseModel):
    """Detailed evaluation result for a single query."""

    query_id: str
    query: str
    expected_status: str
    actual_status: str
    status_match: bool
    recall: float
    precision: float
    retrieved_count: int
    error_message: str | None = None


class EvaluationReport(BaseModel):
    """Aggregate benchmark report containing Recall@K, Precision@K, and Status Accuracy."""

    total_queries: int
    top_k: int
    recall_at_k: float = Field(
        description="Average Recall@K score across evaluated queries (0.0 to 1.0)."
    )
    precision_at_k: float = Field(
        description="Average Precision@K score across evaluated queries (0.0 to 1.0)."
    )
    status_accuracy: float = Field(
        description="Proportion of queries matching expected response status (0.0 to 1.0)."
    )
    successful_matches: int
    missing_evidence_matches: int
    conflicting_source_matches: int
    query_details: list[QueryEvaluationDetail] = Field(default_factory=list)


def evaluate_retrieval(
    db: Session,
    eval_dataset: list[dict[str, Any]],
    top_k: int = 5,
    score_threshold: float = 0.50,
) -> EvaluationReport:
    """
    Evaluates RAG retrieval performance over a benchmark dataset using Recall@K and Precision@K.
    Resilient design: catches query exceptions gracefully to report complete evaluation results.

    Args:
        db: Active SQLModel database session containing indexed documents and chunks.
        eval_dataset: List of test case dictionaries from dataset.py.
        top_k: Max chunks retrieved per query.
        score_threshold: Minimum similarity score.

    Returns:
        Structured EvaluationReport.
    """
    if not eval_dataset:
        return EvaluationReport(
            total_queries=0,
            top_k=top_k,
            recall_at_k=0.0,
            precision_at_k=0.0,
            status_accuracy=0.0,
            successful_matches=0,
            missing_evidence_matches=0,
            conflicting_source_matches=0,
            query_details=[],
        )

    logger.info(f"Starting RAG retrieval evaluation over {len(eval_dataset)} test queries...")

    total_queries = len(eval_dataset)
    recalls: list[float] = []
    precisions: list[float] = []
    status_matches = 0
    successful_matches = 0
    missing_matches = 0
    conflicting_matches = 0
    details: list[QueryEvaluationDetail] = []

    for item in eval_dataset:
        q_id = item.get("id", "unknown")
        query_str = item["query"]
        expected_status = item.get("expected_status", "success")
        expected_doc = item.get("expected_document_title")
        expected_sec = item.get("expected_section")
        gt_metrics = item.get("ground_truth_metrics", [])
        is_missing = item.get("is_missing", False)

        # Precise scheme resolution: exact match on name/code first
        scheme_id = item.get("scheme_id")
        if not scheme_id and item.get("scheme_name") and item["scheme_name"] != "Unknown":
            scheme_name = item["scheme_name"]
            statement = select(Scheme).where(Scheme.name == scheme_name)
            scheme_obj = db.exec(statement).first()
            if not scheme_obj:
                # Fallback to case-insensitive partial match
                statement_like = select(Scheme).where(Scheme.name.ilike(f"%{scheme_name}%"))
                scheme_obj = db.exec(statement_like).first()
            if scheme_obj:
                scheme_id = scheme_obj.id

        # Robust execution loop with error handling
        try:
            response: RAGQueryResponse = retrieve_evidence(
                db=db,
                query=query_str,
                scheme_id=scheme_id,
                limit=top_k,
                score_threshold=score_threshold,
            )
            actual_status = response.status
            retrieved_items = response.evidence
            error_msg = None
        except Exception as err:
            logger.error(f"Error executing retrieval for query '{q_id}': {str(err)}", exc_info=True)
            actual_status = "retrieval_failed"
            retrieved_items = []
            error_msg = str(err)

        is_status_correct = actual_status == expected_status
        if is_status_correct:
            status_matches += 1
            if expected_status == "success":
                successful_matches += 1
            elif expected_status == "no_relevant_evidence":
                missing_matches += 1
            elif expected_status == "conflicting_sources":
                conflicting_matches += 1

        # Calculate Recall@K and Precision@K
        if is_missing or expected_status == "no_relevant_evidence":
            if actual_status == "no_relevant_evidence" and len(retrieved_items) == 0:
                q_recall = 1.0
                q_precision = 1.0
            else:
                q_recall = 0.0
                q_precision = 0.0
        elif actual_status == "retrieval_failed":
            q_recall = 0.0
            q_precision = 0.0
        else:
            if not retrieved_items:
                q_recall = 0.0
                q_precision = 0.0
            else:
                relevant_retrieved = 0
                for ev in retrieved_items:
                    doc_title_match = expected_doc and (
                        expected_doc.lower() in ev.source.title.lower()
                    )
                    sec_title_match = (
                        expected_sec
                        and ev.source.section_title
                        and (expected_sec.lower() in ev.source.section_title.lower())
                    )
                    metric_match = (
                        any(_is_metric_in_text(m, ev.text) for m in gt_metrics)
                        if gt_metrics
                        else False
                    )

                    if doc_title_match or sec_title_match or metric_match:
                        relevant_retrieved += 1

                q_recall = 1.0 if relevant_retrieved > 0 else 0.0
                q_precision = relevant_retrieved / len(retrieved_items)

        recalls.append(q_recall)
        precisions.append(q_precision)

        details.append(
            QueryEvaluationDetail(
                query_id=q_id,
                query=query_str,
                expected_status=expected_status,
                actual_status=actual_status,
                status_match=is_status_correct,
                recall=round(q_recall, 4),
                precision=round(q_precision, 4),
                retrieved_count=len(retrieved_items),
                error_message=error_msg,
            )
        )

    avg_recall = sum(recalls) / total_queries if total_queries > 0 else 0.0
    avg_precision = sum(precisions) / total_queries if total_queries > 0 else 0.0
    accuracy = status_matches / total_queries if total_queries > 0 else 0.0

    report = EvaluationReport(
        total_queries=total_queries,
        top_k=top_k,
        recall_at_k=round(avg_recall, 4),
        precision_at_k=round(avg_precision, 4),
        status_accuracy=round(accuracy, 4),
        successful_matches=successful_matches,
        missing_evidence_matches=missing_matches,
        conflicting_source_matches=conflicting_matches,
        query_details=details,
    )

    logger.info(
        f"RAG Evaluation complete. Recall@{top_k}={report.recall_at_k}, "
        f"Precision@{top_k}={report.precision_at_k}, StatusAccuracy={report.status_accuracy}"
    )

    return report
