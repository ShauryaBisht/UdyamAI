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
