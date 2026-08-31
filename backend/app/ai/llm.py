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

    advisor.py catches this and degrades to the AI-unavailable fallback rather
    than letting the error crash the rest of the analysis.
    """

    def __init__(self, message: str, *, error_code: str = "AI_PROVIDER_UNAVAILABLE") -> None:
        super().__init__(message)
        self.message = message
        self.error_code = error_code


def _error_code_for_exception(exc: Exception) -> str:
    text = str(exc).lower()
    if "timeout" in text or "timed out" in text:
        return "AI_TIMEOUT"
    if "rate limit" in text or "429" in text or "too many requests" in text:
        return "AI_RATE_LIMITED"
    if "content filter" in text or "safety" in text or "blocked" in text:
        return "AI_CONTENT_FILTERED"
    if "context" in text or "token" in text or "too large" in text:
        return "AI_CONTEXT_TOO_LARGE"
    return "AI_PROVIDER_UNAVAILABLE"


def generate(prompt: str) -> str:
    """Call the configured provider and return its raw text response.

    Raises:
        LLMError: on provider failure, timeout, or missing configuration.
    """
    if _PROVIDER == "openai":
        return _generate_openai(prompt)
    if _PROVIDER == "gemini":
        return _generate_gemini(prompt)
    raise LLMError(f"Unknown AI_PROVIDER: {_PROVIDER!r}", error_code="AI_PROVIDER_UNAVAILABLE")


def _generate_openai(prompt: str) -> str:
    try:
        from openai import OpenAI
    except ImportError as exc:
        raise LLMError("openai package not installed", error_code="AI_PROVIDER_UNAVAILABLE") from exc

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise LLMError("OPENAI_API_KEY not configured", error_code="AI_PROVIDER_UNAVAILABLE")

    client = OpenAI(api_key=api_key)
    try:
        response = client.chat.completions.create(
            model=_MODEL or "gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception as exc:
        logger.exception("OpenAI generation failed")
        raise LLMError(str(exc) or "OpenAI request failed", error_code=_error_code_for_exception(exc)) from exc

    try:
        content = response.choices[0].message.content
    except (IndexError, AttributeError, TypeError) as exc:
        raise LLMError("OpenAI returned no usable content", error_code="AI_INVALID_OUTPUT") from exc

    if content is None:
        raise LLMError("OpenAI returned empty content", error_code="AI_INVALID_OUTPUT")
    return content


def _generate_gemini(prompt: str) -> str:
    try:
        from google import genai
    except ImportError as exc:
        raise LLMError("google-genai package not installed", error_code="AI_PROVIDER_UNAVAILABLE") from exc

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise LLMError("GEMINI_API_KEY not configured", error_code="AI_PROVIDER_UNAVAILABLE")

    client = genai.Client(api_key=api_key)
    try:
        response = client.models.generate_content(
            model=_MODEL or "gemini-2.5-flash",
            contents=prompt,
        )
    except Exception as exc:
        logger.exception("Gemini generation failed")
        raise LLMError(str(exc) or "Gemini request failed", error_code=_error_code_for_exception(exc)) from exc

    text = getattr(response, "text", None)
    if not text:
        raise LLMError("Gemini returned no usable content", error_code="AI_INVALID_OUTPUT")
    return text