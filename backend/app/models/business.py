from typing import Optional, List, Dict, Any, TYPE_CHECKING
from datetime import datetime
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON
from geoalchemy2 import Geography

if TYPE_CHECKING:
    from app.models.analysis import AnalysisRun
    from app.models.location import Village

class BusinessCategory(SQLModel, table=True):
    __tablename__ = "business_categories"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(nullable=False)
    sector: Optional[str] = Field(default=None)
    description: Optional[str] = Field(default=None)
    active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    business_models: List["BusinessModel"] = Relationship(back_populates="business_category")
    businesses: List["Business"] = Relationship(back_populates="business_category")
    analysis_runs: List["AnalysisRun"] = Relationship(back_populates="business_category")


class BusinessModel(SQLModel, table=True):
    __tablename__ = "business_models"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    business_category_id: UUID = Field(foreign_key="business_categories.id", nullable=False)
    name: str = Field(nullable=False)
    description: Optional[str] = Field(default=None)
    startup_cost_min: Optional[float] = Field(default=None)
    startup_cost_max: Optional[float] = Field(default=None)
    working_capital: Optional[float] = Field(default=None)

    # JSON fields for assumptions
    revenue_assumptions: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    operating_cost_assumptions: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    risk_assumptions: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))

    active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    business_category: BusinessCategory = Relationship(back_populates="business_models")


class Business(SQLModel, table=True):
    __tablename__ = "businesses"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: Optional[str] = Field(default=None)
    category: Optional[str] = Field(default=None)
    business_category_id: Optional[UUID] = Field(default=None, foreign_key="business_categories.id", nullable=True)
    location_id: Optional[UUID] = Field(default=None, foreign_key="villages.id", nullable=True)
    district: Optional[str] = Field(default=None)
    taluka: Optional[str] = Field(default=None)
    village: Optional[str] = Field(default=None)
    address: Optional[str] = Field(default=None)
    latitude: Optional[float] = Field(default=None)
    longitude: Optional[float] = Field(default=None)
    geom: Optional[Any] = Field(default=None, sa_column=Column(Geography(geometry_type="POINT", srid=4326), nullable=True))

    # Provenance fields
    source: Optional[str] = Field(default=None)
    source_url: Optional[str] = Field(default=None)
    data_year: Optional[int] = Field(default=None)
    verified_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    business_category: Optional[BusinessCategory] = Relationship(back_populates="businesses")
    location: Optional["Village"] = Relationship(back_populates="businesses")
