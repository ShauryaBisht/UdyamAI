from openai import OpenAI

from app.config import settings

_client = None


def get_openai_client() -> OpenAI:
    global _client
    if _client is None:
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        _client = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


def generate_embedding(text: str) -> list[float]:
    """
    Generate an embedding using text-embedding-3-small (1536 dimensions) for a single text.
    """
    client = get_openai_client()
    cleaned_text = text.replace("\n", " ").strip()
    response = client.embeddings.create(input=[cleaned_text], model="text-embedding-3-small")
    return response.data[0].embedding


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings using text-embedding-3-small for a batch of texts.
    """
    if not texts:
        return []
    client = get_openai_client()
    cleaned_texts = [text.replace("\n", " ").strip() for text in texts]
    response = client.embeddings.create(input=cleaned_texts, model="text-embedding-3-small")
    return [item.embedding for item in response.data]
