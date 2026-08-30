from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.location import Village


class Livestock(SQLModel, table=True):
    __tablename__ = "livestock"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    location_id: UUID = Field(foreign_key="villages.id", nullable=False)
    animal_type: str | None = Field(default=None)
    animal_count: int | None = Field(default=None)
    milk_production: float | None = Field(default=None)
    milk_production_unit: str | None = Field(default=None)
    year: int | None = Field(default=None)

    # Provenance fields
    source: str | None = Field(default=None)
    source_url: str | None = Field(default=None)
    data_year: int | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    location: "Village" = Relationship(back_populates="livestock_records")
