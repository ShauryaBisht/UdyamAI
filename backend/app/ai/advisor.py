"""AI Advisor orchestrator.

Pipeline: AnalysisContext -> context_builder -> prompts + llm -> guardrails
          -> recommendation -> AIAdvice

The advisor is intentionally resilient: if the provider, prompt-building, or
validation step fails, it returns a degraded AI response instead of crashing
the rest of the backend analysis flow.
"""

import json
import logging
from typing import Any

from app.ai import context_builder, guardrails, llm, prompts, recommendation
from app.schemas.ai import AIAdvice, AnalysisContext
from app.schemas.rag import RAGQueryResponse, RAGStatus

logger = logging.getLogger(__name__)


def _fallback_ai_advice(language: str = "en") -> AIAdvice:
    normalized_language = language if language in {"en", "hi", "mr"} else "en"
    return AIAdvice(
        summary="AI advisory guidance is temporarily unavailable. The backend analysis remains the authoritative source of truth.",
        recommendation="Review the verified backend analysis before making a final decision. Retry the AI advisory layer once the provider is available.",
        reasoning=[
            "The AI provider or validation pipeline is unavailable.",
            "The system is falling back to verified analysis data only.",
        ],
        financial_advice=[
            "Use the backend-calculated financial summary as the authoritative financial signal.",
        ],
        market_advice=[
            "Use the verified market analysis output as the authoritative market signal.",
        ],
        competition_advice=[
            "Use the verified competition analysis output as the authoritative competition signal.",
        ],
        scheme_advice=[
            "Use the verified scheme matching output as the authoritative scheme signal.",
        ],
        risks=[
            "AI-generated recommendations are currently unavailable.",
            "Decisions should rely on the verified backend analysis until the AI layer recovers.",
        ],
        next_steps=[
            "Retry the AI advisor when the provider is available.",
            "Continue using the structured analysis output as the source of truth.",
        ],
        disclaimers=[
            "AI guidance is unavailable; backend analysis remains authoritative.",
        ],
        sources=[],
        confidence="unverified",
        model_name="unavailable",
        prompt_version="fallback-v1",
        language=normalized_language,
        rag_status=RAGStatus.NO_RELEVANT_EVIDENCE.value,
        evidence=[],
    )


def generate_advice(
    analysis_context: AnalysisContext | dict,
    language: str = "en",
    db: Any | None = None,
) -> AIAdvice:
    """Turn a verified AnalysisContext into structured AIAdvice grounded in RAG evidence.

    The method is intentionally defensive: any provider, prompt, or validation
    issue degrades to a safe fallback rather than crashing the analysis flow.
    """
    logger.info("Generating advice", extra={"language": language})

    try:
        # 1. Construct natural RAG query from AnalysisContext
        ctx_dict = context_builder._as_dict(analysis_context)
        category_name = (
            context_builder._safe_get(ctx_dict, "business", "category", "name")
            or context_builder._safe_get(ctx_dict, "business", "category_name")
            or ""
        )
        district_name = (
            context_builder._safe_get(ctx_dict, "location", "district", "name")
            or context_builder._safe_get(ctx_dict, "location", "district_name")
            or ""
        )
        schemes_list = ctx_dict.get("schemes", []) or []
        scheme_names: list[str] = []
        primary_scheme_id = None
        for s in schemes_list:
            s_dict = context_builder._as_dict(s)
            s_meta = context_builder._as_dict(s_dict.get("scheme"))
            s_id = s_meta.get("id") or s_dict.get("scheme_id")
            if s_id and not primary_scheme_id:
                primary_scheme_id = s_id
            s_name = s_meta.get("name")
            if s_name:
                scheme_names.append(str(s_name))

        query_parts = [
            p
            for p in [
                category_name,
                district_name,
                " ".join(scheme_names),
                "eligibility loan subsidy rules",
            ]
            if p
        ]
        query_str = " ".join(query_parts) or "business scheme rules eligibility subsidy"

        # 2. Perform RAG Retrieval if DB session provided
        rag_response = None
        if db is not None:
            try:
                from app.rag.retriever import retrieve_evidence

                rag_response = retrieve_evidence(
                    db=db,
                    query=query_str,
                    scheme_id=primary_scheme_id,
                    language=language,
                )
            except ImportError as exc:
                logger.error("RAG retriever module import failed: %s", exc)
                rag_response = RAGQueryResponse(
                    status=RAGStatus.NO_RELEVANT_EVIDENCE.value, evidence=[]
                )
            except (ConnectionError, TimeoutError) as exc:
                logger.warning("RAG vector store network/timeout issue: %s", exc)
                rag_response = RAGQueryResponse(
                    status=RAGStatus.NO_RELEVANT_EVIDENCE.value, evidence=[]
                )
            except Exception as exc:
                logger.warning(
                    "RAG evidence retrieval failed; using empty fallback: %s", exc, exc_info=True
                )
                rag_response = RAGQueryResponse(
                    status=RAGStatus.NO_RELEVANT_EVIDENCE.value, evidence=[]
                )
        else:
            rag_response = RAGQueryResponse(
                status=RAGStatus.NO_RELEVANT_EVIDENCE.value, evidence=[]
            )

        # 3. Shape AnalysisContext and RAG evidence into prompt payload.
        prepared_context = context_builder.build(analysis_context, rag_response=rag_response)

        # 4. Build layered prompt containing evidence & status instructions.
        prompt = prompts.build_advisor_prompt(prepared_context, language=language)

        # 5. Call LLM provider abstraction.
        raw_output_str = llm.generate(prompt)

        # Parse JSON output if LLM returns a string
        if isinstance(raw_output_str, str):
            try:
                cleaned_str = raw_output_str.strip()
                if cleaned_str.startswith("```json"):
                    cleaned_str = cleaned_str[7:]
                if cleaned_str.startswith("```"):
                    cleaned_str = cleaned_str[3:]
                if cleaned_str.endswith("```"):
                    cleaned_str = cleaned_str[:-3]
                raw_output = json.loads(cleaned_str.strip())
            except json.JSONDecodeError as exc:
                logger.warning(
                    "LLM response failed JSON parsing; constructing fallback dict: %s", exc
                )
                raw_output = {
                    "summary": str(raw_output_str)[:500],
                    "recommendation": "Review verified backend analysis data.",
                }
            except Exception as exc:
                logger.warning("Unexpected error during LLM response parsing: %s", exc)
                raw_output = {
                    "summary": str(raw_output_str)[:500],
                    "recommendation": "Review verified backend analysis data.",
                }
        else:
            raw_output = context_builder._as_dict(raw_output_str)

        # 6. Validate output against guardrails & attach RAG evidence/status
        validated_output = guardrails.validate(raw_output, prepared_context)

        # 7. Attach deterministic recommendation explanation & conflict warnings
        rec_text = recommendation.explain(prepared_context.get("feasibility", {}))
        if (
            prepared_context.get("rag_status") == RAGStatus.CONFLICTING_SOURCES.value
            or prepared_context.get("rag_status") == RAGStatus.CONFLICTING_SOURCES
        ):
            rec_text += " WARNING: Official government documents contain conflicting rule metrics. Please verify details directly with the relevant official department."
        validated_output["recommendation"] = rec_text

        return AIAdvice.model_validate(validated_output)
    except llm.LLMError as exc:
        logger.warning("AI provider call failed; returning degraded fallback: %s", exc)
        return _fallback_ai_advice(language)
    except Exception:  # pragma: no cover - defensive fallback for incomplete pipeline modules
        logger.exception("AI advice generation failed; returning degraded fallback")
        return _fallback_ai_advice(language)
