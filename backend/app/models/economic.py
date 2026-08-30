from datetime import datetime
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.location import Village


class EconomicIndicator(SQLModel, table=True):
    __tablename__ = "economic_indicators"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    location_id: UUID | None = Field(default=None, foreign_key="villages.id", nullable=True)
    indicator_name: str | None = Field(default=None)
    indicator_value: float | None = Field(default=None)
    unit: str | None = Field(default=None)
    year: int | None = Field(default=None)

    # Provenance fields
    source: str | None = Field(default=None)
    source_url: str | None = Field(default=None)
    data_year: int | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    location: Optional["Village"] = Relationship(back_populates="economic_indicator_records")
