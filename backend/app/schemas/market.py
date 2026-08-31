"""Pydantic response schemas for Market domain data."""

from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class MarketResponse(BaseModel):
    id: UUID
    name: str | None = None
    market_type: str | None = None
    location_id: UUID | None = None
    latitude: float | None = Field(default=None, ge=-90.0, le=90.0)
    longitude: float | None = Field(default=None, ge=-180.0, le=180.0)
    source: str | None = None
    source_url: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class MarketPriceResponse(BaseModel):
    id: UUID
    market_id: UUID | None = None
    location_id: UUID | None = None
    market_name: str | None = None
    commodity: str | None = None
    commodity_variety: str | None = None
    unit: str | None = None
    min_price: float | None = Field(default=None, ge=0)
    max_price: float | None = Field(default=None, ge=0)
    modal_price: float | None = Field(default=None, ge=0)
    arrival_quantity: float | None = Field(default=None, ge=0)
    arrival_unit: str | None = None
    recorded_date: date | None = None
    source: str | None = None
    source_url: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class MarketAnalysisResponse(BaseModel):
    id: UUID
    analysis_run_id: UUID
    radius_km: float | None = None
    population_estimate: int | None = None
    household_estimate: int | None = None
    market_reach_estimate: int | None = None
    competitor_count: int | None = None
    demand_indicators: dict[str, Any] | None = None
    distribution_channels: dict[str, Any] | None = None
    pricing_indicators: dict[str, Any] | None = None
    market_gaps: dict[str, Any] | None = None
    data_confidence: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CompetitorAnalysisResponse(BaseModel):
    id: UUID
    analysis_run_id: UUID
    radius_km: float | None = None
    competitor_count: int | None = None
    competition_density: float | None = None
    competitor_distribution: dict[str, Any] | None = None
    identified_gaps: dict[str, Any] | None = None
    data_confidence: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PriceHistoryResponse(BaseModel):
    commodity: str
    commodity_variety: str | None = None
    market_name: str | None = None
    unit: str | None = None
    prices: list[dict[str, Any]] = Field(
        default_factory=list,
        description="List of {recorded_date, min_price, max_price, modal_price, arrival_quantity}",
    )


class MarketAnalysisRequest(BaseModel):
    village_id: UUID = Field(description="Target village location UUID")
    radii_km: list[float] = Field(
        default=[5.0, 10.0],
        description="List of radii in kilometers to analyze (e.g. [5.0, 10.0])",
    )
    business_category_id: UUID | None = Field(
        default=None,
        description="Optional business category UUID to refine customer conversion & competition analysis",
    )
    analysis_run_id: UUID | None = Field(
        default=None,
        description="Optional analysis run UUID to link and persist MarketAnalysis records",
    )


class MarketProvenanceInfo(BaseModel):
    dataset_name: str
    source: str | None = None
    source_url: str | None = None
    data_year: int | None = None
    record_count: int = 0
    confidence_score: str = "medium"


class NearbyMarketSummary(BaseModel):
    id: UUID | None = None
    name: str | None = None
    market_type: str | None = None
    distance_km: float
    modal_price_sample: float | None = None
    commodity_sample: str | None = None


class NearbyInfrastructureSummary(BaseModel):
    id: UUID | None = None
    name: str | None = None
    facility_type: str | None = None
    distance_km: float
    capacity: float | None = None


class RadiusMarketAnalysisResult(BaseModel):
    radius_km: float
    estimated_population_reach: int = Field(
        ..., description="Total population across villages within radius"
    )
    estimated_household_reach: int = Field(
        ..., description="Total households across villages within radius"
    )
    estimated_target_customers: int = Field(
        ..., description="Estimated addressable customer reach (differentiated from total population)"
    )
    nearby_villages_count: int = 0
    nearby_markets_count: int = 0
    nearby_markets: list[NearbyMarketSummary] = Field(default_factory=list)
    relevant_infrastructure_count: int = 0
    relevant_infrastructure: list[NearbyInfrastructureSummary] = Field(default_factory=list)
    market_indicators: dict[str, Any] = Field(default_factory=dict)
    provenance: list[MarketProvenanceInfo] = Field(default_factory=list)


class LocationMarketAnalysisResponse(BaseModel):
    village_id: UUID
    village_name: str
    district_name: str | None = None
    taluka_name: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    radii_km: list[float]
    radius_analyses: list[RadiusMarketAnalysisResult]
    provenance_summary: list[MarketProvenanceInfo]
    notes: str = Field(
        default="Population reach indicates total demographic count in radius; target customers are calculated based on economic activity and conversion rates."
    )

