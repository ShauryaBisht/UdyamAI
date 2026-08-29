from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON
from geoalchemy2 import Geography

class Market(SQLModel, table=True):
    __tablename__ = "markets"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: Optional[str] = Field(default=None)
    market_type: Optional[str] = Field(default=None)
    location_id: Optional[UUID] = Field(default=None, foreign_key="villages.id", nullable=True)
    latitude: Optional[float] = Field(default=None)
    longitude: Optional[float] = Field(default=None)
    geog: Optional[Any] = Field(default=None, sa_column=Column(Geography(geometry_type="POINT", srid=4326), nullable=True))

    source: Optional[str] = Field(default=None)
    source_url: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    location: Optional["Village"] = Relationship(back_populates="markets")
    prices: List["MarketPrice"] = Relationship(back_populates="market")


class MarketPrice(SQLModel, table=True):
    __tablename__ = "market_prices"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    market_id: Optional[UUID] = Field(default=None, foreign_key="markets.id", nullable=True)
    location_id: Optional[UUID] = Field(default=None, foreign_key="villages.id", nullable=True)

    market_name: Optional[str] = Field(default=None)
    commodity: Optional[str] = Field(default=None)
    commodity_variety: Optional[str] = Field(default=None)
    unit: Optional[str] = Field(default=None)

    min_price: Optional[float] = Field(default=None)
    max_price: Optional[float] = Field(default=None)
    modal_price: Optional[float] = Field(default=None)
    arrival_quantity: Optional[float] = Field(default=None)
    arrival_unit: Optional[str] = Field(default=None)
    recorded_date: Optional[date] = Field(default=None)

    source: Optional[str] = Field(default=None)
    source_url: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    market: Optional[Market] = Relationship(back_populates="prices")
    location: Optional["Village"] = Relationship(back_populates="market_prices")


class MarketAnalysis(SQLModel, table=True):
    __tablename__ = "market_analyses"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    analysis_run_id: UUID = Field(foreign_key="analysis_runs.id", nullable=False)

    radius_km: Optional[float] = Field(default=None)
    population_estimate: Optional[int] = Field(default=None)
    household_estimate: Optional[int] = Field(default=None)
    market_reach_estimate: Optional[int] = Field(default=None)
    competitor_count: Optional[int] = Field(default=None)

    # JSON indicators
    demand_indicators: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    distribution_channels: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    pricing_indicators: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    market_gaps: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))

    data_confidence: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    analysis_run: "AnalysisRun" = Relationship(back_populates="market_analyses")


class CompetitorAnalysis(SQLModel, table=True):
    __tablename__ = "competitor_analyses"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    analysis_run_id: UUID = Field(foreign_key="analysis_runs.id", nullable=False)

    radius_km: Optional[float] = Field(default=None)
    competitor_count: Optional[int] = Field(default=None)
    competition_density: Optional[float] = Field(default=None)

    # JSON distributions
    competitor_distribution: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    identified_gaps: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))

    data_confidence: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    analysis_run: "AnalysisRun" = Relationship(back_populates="competitor_analyses")
