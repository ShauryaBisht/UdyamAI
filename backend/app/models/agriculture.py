from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.location import Village


class Agriculture(SQLModel, table=True):
    __tablename__ = "agriculture"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    location_id: UUID = Field(foreign_key="villages.id", nullable=False)
    crop_name: str | None = Field(default=None)
    crop_category: str | None = Field(default=None)
    cultivated_area: float | None = Field(default=None)
    production: float | None = Field(default=None)
    production_unit: str | None = Field(default=None)
    irrigated_area: float | None = Field(default=None)
    year: int | None = Field(default=None)
    season: str | None = Field(default=None)

    # Provenance fields
    source: str | None = Field(default=None)
    source_url: str | None = Field(default=None)
    data_year: int | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    location: "Village" = Relationship(back_populates="agriculture_records")
