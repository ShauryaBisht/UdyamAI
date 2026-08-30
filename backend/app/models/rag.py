from datetime import date, datetime
from typing import TYPE_CHECKING, Any, Optional
from uuid import UUID, uuid4

from sqlalchemy import Column
from sqlalchemy.types import UserDefinedType
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.scheme import Scheme, SchemeEligibilityRule, SchemeRule


import json


# Custom PGVector UserDefinedType for SQLAlchemy
class PGVectorType(UserDefinedType):
    def get_col_spec(self, **kw):
        return "VECTOR"

    def bind_processor(self, dialect):
        if dialect.name == "sqlite":

            def process(value):
                if value is None:
                    return None
                return json.dumps(value)

            return process
        return super().bind_processor(dialect)

    def result_processor(self, dialect, coltype):
        if dialect.name == "sqlite":

            def process(value):
                if value is None:
                    return None
                return json.loads(value)

            return process
        return super().result_processor(dialect, coltype)


class Document(SQLModel, table=True):
    __tablename__ = "documents"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str = Field(nullable=False)
    source_name: str | None = Field(default=None)
    source_url: str | None = Field(default=None)
    document_type: str | None = Field(default=None)  # e.g., scheme_guideline, official_faq

    language: str | None = Field(default=None)
    file_path: str | None = Field(default=None)

    published_date: date | None = Field(default=None)
    effective_from: date | None = Field(default=None)
    effective_until: date | None = Field(default=None)

    last_verified_at: datetime | None = Field(default=None)
    content_hash: str | None = Field(default=None)
    active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    chunks: list["DocumentChunk"] = Relationship(back_populates="document")
    scheme_rules: list["SchemeRule"] = Relationship(back_populates="source_document")
    scheme_eligibility_rules: list["SchemeEligibilityRule"] = Relationship(
        back_populates="source_document"
    )


class DocumentChunk(SQLModel, table=True):
    __tablename__ = "document_chunks"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    document_id: UUID = Field(foreign_key="documents.id", nullable=False)
    scheme_id: UUID | None = Field(default=None, foreign_key="schemes.id", nullable=True)

    chunk_index: int | None = Field(default=None)
    content: str = Field(nullable=False)
    page_number: int | None = Field(default=None)
    section_title: str | None = Field(default=None)

    # pgvector embedding field
    embedding: Any | None = Field(
        default=None, sa_column=Column("embedding", PGVectorType, nullable=True)
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    document: Document = Relationship(back_populates="chunks")
    scheme: Optional["Scheme"] = Relationship(back_populates="document_chunks")
