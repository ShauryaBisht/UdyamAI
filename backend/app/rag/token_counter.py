import tiktoken

from app.config import settings

# Pricing per million tokens in dollars
EMBEDDING_COST_PER_MILLION_TOKENS = 0.02


def get_encoding() -> tiktoken.Encoding:
    """Get tiktoken encoding for the configured embedding model."""
    try:
        return tiktoken.encoding_for_model(settings.RAG_EMBEDDING_MODEL)
    except KeyError:
        # Fallback to cl100k_base if model encoding is not directly resolved
        return tiktoken.get_encoding("cl100k_base")


def count_tokens(text: str) -> int:
    """Count tokens in a string using tiktoken."""
    if not text:
        return 0
    encoding = get_encoding()
    return len(encoding.encode(text))


def count_tokens_batch(texts: list[str]) -> int:
    """Count total tokens in a batch of strings."""
    return sum(count_tokens(text) for text in texts)


def estimate_embedding_cost(tokens: int) -> float:
    """Estimate the cost in dollars for the given token count."""
    return (tokens / 1_000_000) * EMBEDDING_COST_PER_MILLION_TOKENS
