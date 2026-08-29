import datetime
from typing import Optional
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship

class Weather(SQLModel, table=True):
    __tablename__ = "weather"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    location_id: Optional[UUID] = Field(default=None, foreign_key="villages.id", nullable=True)
    date: Optional[datetime.date] = Field(default=None, index=True)
    rainfall_mm: Optional[float] = Field(default=None)
    temperature_min: Optional[float] = Field(default=None)
    temperature_max: Optional[float] = Field(default=None)
    drought_indicator: bool = Field(default=False)

    # Provenance fields
    source: Optional[str] = Field(default=None)
    source_url: Optional[str] = Field(default=None)
    data_year: Optional[int] = Field(default=None)
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

    # Relationships
    location: Optional["Village"] = Relationship(back_populates="weather_records")
