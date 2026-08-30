from typing import Optional, Any, TYPE_CHECKING
from datetime import datetime
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column
from geoalchemy2 import Geography

if TYPE_CHECKING:
    from app.models.location import Village

class Infrastructure(SQLModel, table=True):
    __tablename__ = "infrastructure"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    location_id: Optional[UUID] = Field(default=None, foreign_key="villages.id", nullable=True)
    facility_type: Optional[str] = Field(default=None)
    name: Optional[str] = Field(default=None)
    latitude: Optional[float] = Field(default=None)
    longitude: Optional[float] = Field(default=None)
    geog: Optional[Any] = Field(default=None, sa_column=Column(Geography(geometry_type="POINT", srid=4326), nullable=True))
    distance_from_village: Optional[float] = Field(default=None)
    capacity: Optional[float] = Field(default=None)

    # Provenance fields
    source: Optional[str] = Field(default=None)
    source_url: Optional[str] = Field(default=None)
    data_year: Optional[int] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    location: Optional["Village"] = Relationship(back_populates="infrastructure_records")
