"""AI Advisor orchestrator.

Pipeline: AnalysisContext -> context_builder -> prompts + llm -> guardrails
          -> recommendation -> AIAdvice

NOTE: AnalysisContext / AIAdvice are loosely typed (dict) here on purpose —
schemas/ai.py (today's 3rd task) hasn't landed yet. Tighten these signatures
to the real Pydantic models once it does; don't leave this as dict long-term.
See docs/ai-contract.md for the target shapes.
"""

import logging
from typing import Any

from app.ai import context_builder, guardrails, llm, prompts, recommendation

logger = logging.getLogger(__name__)


def generate_advice(analysis_context: dict[str, Any], language: str = "en") -> dict[str, Any]:
    """Turn a verified AnalysisContext into structured AIAdvice.

    Args:
        analysis_context: backend-verified facts (financial, market, competition,
            schemes, feasibility). See docs/ai-contract.md section 1.
        language: output language code ("en" | "hi" | "mr").

    Returns:
        AIAdvice-shaped dict. See docs/ai-contract.md section 2.
    """
    logger.info("Generating advice", extra={"language": language})

    # 1. Shape the raw AnalysisContext into whatever the prompt needs,
    #    attaching source references (contract section 5) as we go.
    prepared_context = context_builder.build(analysis_context)

    # 2. Build the layered prompt (system -> grounding rules -> task -> context -> schema).
    prompt = prompts.build_advisor_prompt(prepared_context, language=language)

    # 3. Call the LLM through the provider abstraction (today's 2nd task — llm.py).
    raw_output = llm.generate(prompt)

    # 4. Validate structure + run hallucination guardrails against prepared_context.
    validated_output = guardrails.validate(raw_output, prepared_context)

    # 5. Attach the deterministic recommendation explanation — never recalculates the score.
    validated_output["recommendation"] = recommendation.explain(
        prepared_context.get("feasibility", {})
    )

    return validated_output