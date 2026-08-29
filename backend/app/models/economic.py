from typing import Optional
from datetime import datetime
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship

class EconomicIndicator(SQLModel, table=True):
    __tablename__ = "economic_indicators"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    location_id: Optional[UUID] = Field(default=None, foreign_key="villages.id", nullable=True)
    indicator_name: Optional[str] = Field(default=None)
    indicator_value: Optional[float] = Field(default=None)
    unit: Optional[str] = Field(default=None)
    year: Optional[int] = Field(default=None)

    # Provenance fields
    source: Optional[str] = Field(default=None)
    source_url: Optional[str] = Field(default=None)
    data_year: Optional[int] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    location: Optional["Village"] = Relationship(back_populates="economic_indicator_records")
