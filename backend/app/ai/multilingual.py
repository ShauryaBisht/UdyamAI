# UdyamAI: multilingual.py
"""Language helpers for channels that carry free text without a language tag.

The HTTP API takes an explicit ``language`` field, but inbound channels (WhatsApp,
and later voice) only give us raw text, so the language has to be inferred.
"""

from __future__ import annotations

_DEVANAGARI_START = "\u0900"
_DEVANAGARI_END = "\u097f"


def detect_language(text: str | None) -> str:
    """Best-effort language code for free text: ``"hi"`` or ``"en"``.

    Hindi and Marathi share the Devanagari script, so a script sniff cannot tell
    them apart. Guessing ``"mr"`` would be wrong at least as often as it is right,
    so we return the safe default and leave Marathi to an explicit choice (the API
    ``language`` field, or the Phase 2 profile lookup).
    """
    if not text:
        return "en"

    for char in text:
        if _DEVANAGARI_START <= char <= _DEVANAGARI_END:
            return "hi"
    return "en"
