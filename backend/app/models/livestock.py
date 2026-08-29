from typing import Optional
from datetime import datetime
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship

class Livestock(SQLModel, table=True):
    __tablename__ = "livestock"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    location_id: UUID = Field(foreign_key="villages.id", nullable=False)
    animal_type: Optional[str] = Field(default=None)
    animal_count: Optional[int] = Field(default=None)
    milk_production: Optional[float] = Field(default=None)
    milk_production_unit: Optional[str] = Field(default=None)
    year: Optional[int] = Field(default=None)

    # Provenance fields
    source: Optional[str] = Field(default=None)
    source_url: Optional[str] = Field(default=None)
    data_year: Optional[int] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    location: "Village" = Relationship(back_populates="livestock_records")
