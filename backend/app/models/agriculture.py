from typing import Optional, TYPE_CHECKING
from datetime import datetime
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.models.location import Village

class Agriculture(SQLModel, table=True):
    __tablename__ = "agriculture"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    location_id: UUID = Field(foreign_key="villages.id", nullable=False)
    crop_name: Optional[str] = Field(default=None)
    crop_category: Optional[str] = Field(default=None)
    cultivated_area: Optional[float] = Field(default=None)
    production: Optional[float] = Field(default=None)
    production_unit: Optional[str] = Field(default=None)
    irrigated_area: Optional[float] = Field(default=None)
    year: Optional[int] = Field(default=None)
    season: Optional[str] = Field(default=None)

    # Provenance fields
    source: Optional[str] = Field(default=None)
    source_url: Optional[str] = Field(default=None)
    data_year: Optional[int] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    location: "Village" = Relationship(back_populates="agriculture_records")
