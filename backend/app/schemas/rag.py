from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class DocumentCreate(BaseModel):
    """Schema for creating a new RAG document."""

    title: str = Field(..., min_length=1, max_length=255)
    source_name: str = Field(..., min_length=1, max_length=255)
    source_url: str | None = Field(default=None, max_length=500)
    document_type: str = Field(..., min_length=1, max_length=100)
    language: str = Field(default="hi", max_length=10)
    file_path: str | None = Field(default=None, max_length=500)
    published_date: date | None = None
    effective_from: date | None = None
    effective_until: date | None = None
    last_verified_at: datetime | None = None
    content_hash: str = Field(..., min_length=1, max_length=64)
    active: bool = True


class DocumentRead(BaseModel):
    """Schema for reading a RAG document."""

    id: UUID
    title: str
    source_name: str
    source_url: str | None = None
    document_type: str
    language: str
    file_path: str | None = None
    published_date: date | None = None
    effective_from: date | None = None
    effective_until: date | None = None
    last_verified_at: datetime | None = None
    content_hash: str
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ChunkCreate(BaseModel):
    """Schema for creating a document chunk."""

    document_id: UUID
    scheme_id: UUID | None = None
    chunk_index: int = Field(..., ge=0)
    content: str = Field(..., min_length=1)
    page_number: int | None = Field(default=None, ge=1)
    section_title: str | None = Field(default=None, max_length=255)
    embedding: list[float] | None = Field(
        default=None, description="Vector embedding (1536 dimensions for OpenAI ada-002)"
    )


class ChunkRead(BaseModel):
    """Schema for reading a document chunk."""

    id: UUID
    document_id: UUID
    scheme_id: UUID | None = None
    chunk_index: int
    content: str
    page_number: int | None = None
    section_title: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
