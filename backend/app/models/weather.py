import datetime
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.location import Village


class Weather(SQLModel, table=True):
    __tablename__ = "weather"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    location_id: UUID | None = Field(default=None, foreign_key="villages.id", nullable=True)
    date: datetime.date | None = Field(default=None, index=True)
    rainfall_mm: float | None = Field(default=None)
    temperature_min: float | None = Field(default=None)
    temperature_max: float | None = Field(default=None)
    drought_indicator: bool = Field(default=False)

    # Provenance fields
    source: str | None = Field(default=None)
    source_url: str | None = Field(default=None)
    data_year: int | None = Field(default=None)
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

    # Relationships
    location: Optional["Village"] = Relationship(back_populates="weather_records")
