"""Query processor for RAG: normalization, language detection, and expansion.

Pipeline:
  raw query → normalization → language detection → expansion
  → preserve exact terms for keyword search

Preserves: scheme names, numbers, percentages, locations, acronyms, loan terms.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# Common scheme acronyms and names that must be preserved exactly
_SCHEME_TERMS = {
    "pmegp",
    "pmfme",
    "mudra",
    "cmegp",
    "nsfdc",
    "nbcfdc",
    "kvic",
    "pmjdy",
    "pmuy",
    "pmay",
    "pmsby",
    "pmjjby",
    "pm-kisan",
    "mahatma gandhi",
    "stand-up india",
    "startup india",
}

# Vernacular → English term mapping for query expansion
_TERM_EXPANSIONS = {
    # Hindi terms
    "rin": "loan",
    "byaj": "interest",
    "subsidy": "subsidy",
    "yojana": "scheme",
    "vyapar": "business",
    "karobar": "business",
    "paise": "money capital",
    "paisa": "money capital",
    "karz": "loan debt",
    "sahayata": "assistance subsidy",
    "anudan": "grant subsidy",
    "sarkari": "government",
    "rozgar": "employment",
    "udyog": "enterprise business",
    "laghu udyog": "small enterprise MSME",
    # Marathi terms
    "karj": "loan debt",
    "vyaj": "interest",
    "anudaan": "grant subsidy",
    "shaskiy": "government",
    "vyavsay": "business",
    "naukri": "employment job",
    # Common abbreviations
    "emi": "equated monthly installment EMI",
    "roi": "rate of interest",
    "msme": "micro small medium enterprise",
    "shg": "self help group",
    "ngo": "non governmental organization",
}

# Hindi stopwords to skip during expansion
_STOPWORDS = {
    "ka",
    "ki",
    "ke",
    "ko",
    "se",
    "me",
    "hai",
    "hain",
    "tha",
    "thi",
    "the",
    "woh",
    "yah",
    "aur",
    "ya",
    "par",
    "mein",
    "kya",
    "kaise",
    "kab",
    "kahan",
    "kyun",
    "mujhe",
    "mera",
    "meri",
    "mere",
    "is",
    "us",
    "in",
    "un",
    "ek",
    "do",
    "teen",
    "cha",
    "che",
    "ani",
    "he",
    "aahe",
    "ahe",  # Marathi
}

# Language detection patterns
_DEVANAGARI_RANGE = re.compile(r"[\u0900-\u097F]")
_BENGALI_RANGE = re.compile(r"[\u0980-\u09FF]")
_TAMIL_RANGE = re.compile(r"[\u0B80-\u0BFF]")
_TELUGU_RANGE = re.compile(r"[\u0C00-\u0C7F]")
_KANNADA_RANGE = re.compile(r"[\u0C80-\u0CFF]")
_MALAYALAM_RANGE = re.compile(r"[\u0D00-\u0D7F]")
_GUJARATI_RANGE = re.compile(r"[\u0A80-\u0AFF]")
_GURMUKHI_RANGE = re.compile(r"[\u0A00-\u0A7F]")
_ODIA_RANGE = re.compile(r"[\u0B00-\u0B7F]")


@dataclass
class ProcessedQuery:
    """Result of query processing."""

    original: str
    normalized: str
    expanded: str
    detected_language: str | None = None
    preserved_terms: list[str] = field(default_factory=list)
    is_mixed_language: bool = False


def detect_language(text: str) -> str | None:
    """Detect the primary script/language of the text."""
    if not text:
        return None

    # Count characters in each script
    devanagari = len(_DEVANAGARI_RANGE.findall(text))
    bengali = len(_BENGALI_RANGE.findall(text))
    tamil = len(_TAMIL_RANGE.findall(text))
    telugu = len(_TELUGU_RANGE.findall(text))
    kannada = len(_KANNADA_RANGE.findall(text))
    malayalam = len(_MALAYALAM_RANGE.findall(text))
    gujarati = len(_GUJARATI_RANGE.findall(text))
    gurmukhi = len(_GURMUKHI_RANGE.findall(text))
    odia = len(_ODIA_RANGE.findall(text))
    latin = len(re.findall(r"[a-zA-Z]", text))

    counts = {
        "hi": devanagari,  # Could be Hindi or Marathi
        "bn": bengali,
        "ta": tamil,
        "te": telugu,
        "kn": kannada,
        "ml": malayalam,
        "gu": gujarati,
        "pa": gurmukhi,
        "or": odia,
        "en": latin,
    }

    total_chars = sum(counts.values())
    if total_chars == 0:
        return None

    max_lang = max(counts, key=counts.get)
    return max_lang if counts[max_lang] > 0 else None


def _is_mixed_script(text: str) -> bool:
    """Check if query contains substantial mix of Indic and Latin scripts."""
    latin = len(re.findall(r"[a-zA-Z]", text))
    indic = len(
        _DEVANAGARI_RANGE.findall(text)
        + _BENGALI_RANGE.findall(text)
        + _TAMIL_RANGE.findall(text)
        + _TELUGU_RANGE.findall(text)
        + _KANNADA_RANGE.findall(text)
        + _MALAYALAM_RANGE.findall(text)
        + _GUJARATI_RANGE.findall(text)
        + _GURMUKHI_RANGE.findall(text)
        + _ODIA_RANGE.findall(text)
    )
    total = latin + indic
    if total < 4:
        return False
    return (latin / total >= 0.15) and (indic / total >= 0.15)


def _extract_preserved_terms(text: str) -> list[str]:
    """Extract terms that should be preserved exactly (not rewritten)."""
    preserved = []

    # Scheme names
    lower = text.lower()
    for term in _SCHEME_TERMS:
        if term in lower:
            # Find the actual casing in text
            idx = lower.find(term)
            preserved.append(text[idx : idx + len(term)])

    # Numbers and percentages
    preserved.extend(re.findall(r"\d+(?:\.\d+)?%", text))
    preserved.extend(re.findall(r"₹\s*[\d,.]+", text))
    preserved.extend(re.findall(r"\b\d+(?:\.\d+)?\s*(?:lakh|crore|thousand)s?\b", text, re.I))

    # Capitalized acronyms (2+ uppercase letters)
    preserved.extend(re.findall(r"\b[A-Z]{2,}\b", text))

    return preserved


def _normalize(text: str) -> str:
    """Normalize query text: strip, collapse whitespace."""
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    return text


def _expand_query(text: str, max_expansions: int = 4) -> str:
    """Expand key vernacular/abbreviated domain terms conservatively without diluting retrieval."""
    words = text.split()
    expanded_words = list(words)
    expansions_added = 0

    for word in words:
        if expansions_added >= max_expansions:
            break
        lower = word.lower().strip("?.,!\"'()[]{}")
        if lower in _STOPWORDS or len(lower) < 2:
            continue
        expansion = _TERM_EXPANSIONS.get(lower)
        if expansion:
            for exp_word in expansion.split():
                if exp_word.lower() not in {w.lower() for w in expanded_words}:
                    expanded_words.append(exp_word)
                    expansions_added += 1
                    if expansions_added >= max_expansions:
                        break

    return " ".join(expanded_words)


def process_query(query: str) -> ProcessedQuery:
    """Process a raw user query for RAG retrieval.

    Pipeline:
      1. Normalize whitespace
      2. Detect dominant language and mixed-script presence
      3. Extract preserved terms (scheme names, numbers, acronyms)
      4. Expand vernacular terms conservatively
      5. Return original + expanded for hybrid search
    """
    normalized = _normalize(query)
    detected_lang = detect_language(normalized)
    mixed_script = _is_mixed_script(normalized)
    preserved = _extract_preserved_terms(normalized)
    expanded = _expand_query(normalized)

    result = ProcessedQuery(
        original=query,
        normalized=normalized,
        expanded=expanded,
        detected_language=detected_lang,
        preserved_terms=preserved,
        is_mixed_language=mixed_script,
    )

    logger.debug(
        "Query processed: lang=%s, mixed=%s, preserved=%s, expanded='%s...'",
        detected_lang,
        mixed_script,
        preserved[:3],
        expanded[:50],
    )
    return result
