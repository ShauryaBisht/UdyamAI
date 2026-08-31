"""AI Advisor orchestrator.

Pipeline: AnalysisContext -> context_builder -> prompts + llm -> guardrails
          -> recommendation -> AIAdvice

The advisor is intentionally resilient: if the provider, prompt-building, or
validation step fails, it returns a degraded AI response instead of crashing
the rest of the backend analysis flow.
"""

import logging

from app.ai import context_builder, guardrails, llm, prompts, recommendation
from app.schemas.ai import AIAdvice, AnalysisContext

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
    )


def generate_advice(analysis_context: AnalysisContext, language: str = "en") -> AIAdvice:
    """Turn a verified AnalysisContext into structured AIAdvice.

    The method is intentionally defensive: any provider, prompt, or validation
    issue degrades to a safe fallback rather than crashing the analysis flow.
    """
    logger.info("Generating advice", extra={"language": language})

    try:
        # 1. Shape the raw AnalysisContext into the prompt-friendly payload.
        prepared_context = context_builder.build(analysis_context)

        # 2. Build the layered prompt (system -> grounding rules -> task -> context -> schema).
        prompt = prompts.build_advisor_prompt(prepared_context, language=language)

        # 3. Call the LLM through the provider abstraction.
        raw_output = llm.generate(prompt)

        # 4. Validate structure + run hallucination guardrails against prepared_context.
        validated_output = guardrails.validate(raw_output, prepared_context)

        # 5. Attach the deterministic recommendation explanation.
        validated_output["recommendation"] = recommendation.explain(
            prepared_context.get("feasibility", {})
        )

        return AIAdvice.model_validate(validated_output)
    except llm.LLMError as exc:
        logger.warning("AI provider call failed; returning degraded fallback: %s", exc)
        return _fallback_ai_advice(language)
    except Exception:  # pragma: no cover - defensive fallback for incomplete pipeline modules
        logger.exception("AI advice generation failed; returning degraded fallback")
        return _fallback_ai_advice(language)
