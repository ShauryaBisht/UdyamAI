"""LLM provider abstraction.

Keeps the AI Advisor decoupled from any specific model/provider — swapping
providers should mean an env var change, not touching advisor.py, prompts.py,
or guardrails.py. See task doc sections 15-16.
"""

import logging
import os

logger = logging.getLogger(__name__)

_PROVIDER = os.getenv("AI_PROVIDER", "openai").lower()
_MODEL = os.getenv("AI_MODEL")  # optional override; each provider has a default below


class LLMError(Exception):
    """Raised on provider failure/timeout/misconfiguration.

    advisor.py should catch this and degrade to the AI-unavailable fallback
    (task doc section 21) rather than letting it propagate to the caller.
    """


def generate(prompt: str) -> str:
    """Call the configured provider and return its raw text response.

    Raises:
        LLMError: on provider failure, timeout, or missing configuration.
    """
    if _PROVIDER == "openai":
        return _generate_openai(prompt)
    if _PROVIDER == "gemini":
        return _generate_gemini(prompt)
    raise LLMError(f"Unknown AI_PROVIDER: {_PROVIDER!r}")


def _generate_openai(prompt: str) -> str:
    try:
        from openai import OpenAI
    except ImportError as exc:
        raise LLMError("openai package not installed") from exc

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise LLMError("OPENAI_API_KEY not configured")

    client = OpenAI(api_key=api_key)
    try:
        response = client.chat.completions.create(
            model=_MODEL or "gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception as exc:
        logger.exception("OpenAI generation failed")
        raise LLMError(str(exc)) from exc

    return response.choices[0].message.content


def _generate_gemini(prompt: str) -> str:
    try:
        from google import genai
    except ImportError as exc:
        raise LLMError("google-genai package not installed") from exc

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise LLMError("GEMINI_API_KEY not configured")

    client = genai.Client(api_key=api_key)
    try:
        response = client.models.generate_content(
            model=_MODEL or "gemini-2.5-flash",
            contents=prompt,
        )
    except Exception as exc:
        logger.exception("Gemini generation failed")
        raise LLMError(str(exc)) from exc

    return response.text