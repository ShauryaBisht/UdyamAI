from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column
from geoalchemy2 import Geography

class District(SQLModel, table=True):
    __tablename__ = "districts"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(nullable=False)
    state: str = Field(default="Maharashtra", nullable=False)
    lgd_code: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    talukas: List["Taluka"] = Relationship(back_populates="district")
    gram_panchayats: List["GramPanchayat"] = Relationship(back_populates="district")
    villages: List["Village"] = Relationship(back_populates="district")


class Taluka(SQLModel, table=True):
    __tablename__ = "talukas"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(nullable=False)
    district_id: UUID = Field(foreign_key="districts.id", nullable=False)
    lgd_code: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    district: District = Relationship(back_populates="talukas")
    gram_panchayats: List["GramPanchayat"] = Relationship(back_populates="taluka")
    villages: List["Village"] = Relationship(back_populates="taluka")


class GramPanchayat(SQLModel, table=True):
    __tablename__ = "gram_panchayats"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(nullable=False)
    taluka_id: UUID = Field(foreign_key="talukas.id", nullable=False)
    district_id: UUID = Field(foreign_key="districts.id", nullable=False)
    lgd_code: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    district: District = Relationship(back_populates="gram_panchayats")
    taluka: Taluka = Relationship(back_populates="gram_panchayats")
    villages: List["Village"] = Relationship(back_populates="gram_panchayat")


class Village(SQLModel, table=True):
    __tablename__ = "villages"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(nullable=False)
    district_id: UUID = Field(foreign_key="districts.id", nullable=False)
    taluka_id: UUID = Field(foreign_key="talukas.id", nullable=False)
    gram_panchayat_id: UUID = Field(foreign_key="gram_panchayats.id", nullable=False)
    lgd_code: Optional[str] = Field(default=None)
    pin_code: Optional[str] = Field(default=None)
    latitude: Optional[float] = Field(default=None)
    longitude: Optional[float] = Field(default=None)
    geom: Optional[Any] = Field(default=None, sa_column=Column(Geography(geometry_type="POINT", srid=4326), nullable=True))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    district: District = Relationship(back_populates="villages")
    taluka: Taluka = Relationship(back_populates="villages")
    gram_panchayat: GramPanchayat = Relationship(back_populates="villages")

    # User profiles & Analysis Runs
    profiles: List["Profile"] = Relationship(back_populates="location")
    analysis_runs: List["AnalysisRun"] = Relationship(back_populates="location")

    # Local Datasets Relationships
    population_records: List["Population"] = Relationship(back_populates="location")
    businesses: List["Business"] = Relationship(back_populates="location")
    agriculture_records: List["Agriculture"] = Relationship(back_populates="location")
    livestock_records: List["Livestock"] = Relationship(back_populates="location")
    economic_indicator_records: List["EconomicIndicator"] = Relationship(back_populates="location")
    infrastructure_records: List["Infrastructure"] = Relationship(back_populates="location")
    weather_records: List["Weather"] = Relationship(back_populates="location")
    markets: List["Market"] = Relationship(back_populates="location")
    market_prices: List["MarketPrice"] = Relationship(back_populates="location")


class Population(SQLModel, table=True):
    __tablename__ = "population"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    location_id: UUID = Field(foreign_key="villages.id", nullable=False)
    year: int = Field(nullable=False, index=True)
    population_total: Optional[int] = Field(default=None)
    male_population: Optional[int] = Field(default=None)
    female_population: Optional[int] = Field(default=None)
    households: Optional[int] = Field(default=None)
    working_population: Optional[int] = Field(default=None)
    literacy_rate: Optional[float] = Field(default=None)

    # Provenance fields
    source: Optional[str] = Field(default=None)
    source_url: Optional[str] = Field(default=None)
    data_year: Optional[int] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    location: Village = Relationship(back_populates="population_records")
