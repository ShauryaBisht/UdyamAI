from typing import Any
from uuid import UUID

from app.config import settings


def chunk_document(
    pages: list[dict[str, Any]],
    document_id: UUID,
    source_title: str,
    source_url: str | None = None,
    document_version: str | None = None,
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
) -> list[dict[str, Any]]:
    """
    Splits page-extracted text into sliding-window chunks.

    Returns:
        A list of dicts with text and metadata:
        {
            "document_id": UUID,
            "page_number": int,
            "chunk_index": int,
            "content": str,
            "section_heading": str | None,
            "source_title": str,
            "source_url": str | None,
            "document_version": str | None
        }
    """
    size = chunk_size if chunk_size is not None else settings.RAG_CHUNK_SIZE
    overlap = chunk_overlap if chunk_overlap is not None else settings.RAG_CHUNK_OVERLAP

    if size <= 0:
        raise ValueError("chunk_size must be greater than 0")
    if overlap < 0 or overlap >= size:
        raise ValueError("chunk_overlap must be non-negative and strictly less than chunk_size")

    chunks = []
    chunk_index = 0

    for page_data in pages:
        page_num = page_data["page_number"]
        text = page_data["text"]

        if not text:
            continue

        # Perform sliding window on the page text
        start = 0
        text_len = len(text)

        while start < text_len:
            end = start + size
            chunk_text = text[start:end].strip()

            # Avoid empty chunks at the very end of text if any
            if not chunk_text:
                break

            # Identify optional section headings: check if the first line starts with a title-like format
            lines = chunk_text.split("\n")
            section_heading = None
            if lines:
                first_line = lines[0].strip()
                if 0 < len(first_line) < 100:
                    section_heading = first_line

            chunks.append(
                {
                    "document_id": document_id,
                    "page_number": page_num,
                    "chunk_index": chunk_index,
                    "content": chunk_text,
                    "section_heading": section_heading,
                    "source_title": source_title,
                    "source_url": source_url,
                    "document_version": document_version,
                }
            )

            chunk_index += 1

            # Break if we've processed up to or beyond the end of the text
            if start + size >= text_len:
                break

            start += size - overlap

    return chunks
