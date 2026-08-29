from typing import Optional, List, Any
from datetime import datetime, date
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column
from sqlalchemy.types import UserDefinedType

# Custom PGVector UserDefinedType for SQLAlchemy
class PGVectorType(UserDefinedType):
    def get_col_spec(self, **kw):
        return "VECTOR"


class Document(SQLModel, table=True):
    __tablename__ = "documents"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str = Field(nullable=False)
    source_name: Optional[str] = Field(default=None)
    source_url: Optional[str] = Field(default=None)
    document_type: Optional[str] = Field(default=None) # e.g., scheme_guideline, official_faq

    language: Optional[str] = Field(default=None)
    file_path: Optional[str] = Field(default=None)

    published_date: Optional[date] = Field(default=None)
    effective_from: Optional[date] = Field(default=None)
    effective_until: Optional[date] = Field(default=None)

    last_verified_at: Optional[datetime] = Field(default=None)
    content_hash: Optional[str] = Field(default=None)
    active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    chunks: List["DocumentChunk"] = Relationship(back_populates="document")
    scheme_rules: List["SchemeRule"] = Relationship(back_populates="source_document")
    scheme_eligibility_rules: List["SchemeEligibilityRule"] = Relationship(back_populates="source_document")


class DocumentChunk(SQLModel, table=True):
    __tablename__ = "document_chunks"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    document_id: UUID = Field(foreign_key="documents.id", nullable=False)
    scheme_id: Optional[UUID] = Field(default=None, foreign_key="schemes.id", nullable=True)

    chunk_index: Optional[int] = Field(default=None)
    content: str = Field(nullable=False)
    page_number: Optional[int] = Field(default=None)
    section_title: Optional[str] = Field(default=None)

    # pgvector embedding field
    embedding: Optional[Any] = Field(default=None, sa_column=Column("embedding", PGVectorType, nullable=True))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    document: Document = Relationship(back_populates="chunks")
    scheme: Optional["Scheme"] = Relationship(back_populates="document_chunks")
