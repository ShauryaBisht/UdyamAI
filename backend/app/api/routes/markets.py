"""API routes for Market data queries."""

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.database import get_session
from app.schemas.market import (
    CompetitorAnalysisResponse,
    MarketAnalysisResponse,
    MarketPriceResponse,
    MarketResponse,
)
from app.services.market_service import MarketService

router = APIRouter()


# ------------------------------------------------------------------ #
# Static paths FIRST (before /{market_id})
# ------------------------------------------------------------------ #


@router.get("/types", response_model=list[str])
def list_market_types(db: Session = Depends(get_session)):
    """Get distinct market types."""
    return MarketService.get_market_types(db)


@router.get("/commodities", response_model=list[str])
def list_commodities(
    market_id: UUID | None = Query(default=None, description="Filter by market"),
    location_id: UUID | None = Query(default=None, description="Filter by location"),
    db: Session = Depends(get_session),
):
    """Get distinct commodity names."""
    return MarketService.get_commodities(db, market_id=market_id, location_id=location_id)


@router.get("/prices", response_model=list[MarketPriceResponse])
def list_market_prices(
    market_id: UUID | None = Query(default=None, description="Filter by market UUID"),
    location_id: UUID | None = Query(default=None, description="Filter by village location UUID"),
    commodity: str | None = Query(default=None, description="Filter by commodity name"),
    recorded_date: date | None = Query(default=None, description="Filter by exact date"),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_session),
):
    """List market prices with optional filters."""
    return MarketService.get_market_prices(
        db,
        market_id=market_id,
        location_id=location_id,
        commodity=commodity,
        recorded_date=recorded_date,
        limit=limit,
    )


@router.get("/prices/history", response_model=MarketPriceResponse)
def get_price_history(
    commodity: str = Query(..., description="Commodity name"),
    market_id: UUID | None = Query(default=None, description="Filter by market"),
    location_id: UUID | None = Query(default=None, description="Filter by location"),
    start_date: date | None = Query(default=None, description="Start of date range"),
    end_date: date | None = Query(default=None, description="End of date range"),
    limit: int = Query(default=365, ge=1, le=1000),
    db: Session = Depends(get_session),
):
    """Get price history for a commodity over time."""
    return MarketService.get_price_history(
        db,
        commodity=commodity,
        market_id=market_id,
        location_id=location_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
    )


@router.get("/prices/latest", response_model=list[MarketPriceResponse])
def get_latest_prices(
    market_id: UUID | None = Query(default=None, description="Filter by market"),
    location_id: UUID | None = Query(default=None, description="Filter by location"),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_session),
):
    """Get the most recent price for each commodity."""
    return MarketService.get_latest_prices(
        db, market_id=market_id, location_id=location_id, limit=limit
    )


# ------------------------------------------------------------------ #
# Market / Competitor Analyses
# ------------------------------------------------------------------ #


@router.get("/analyses/{analysis_run_id}", response_model=list[MarketAnalysisResponse])
def get_market_analyses(analysis_run_id: UUID, db: Session = Depends(get_session)):
    """Get market analyses for an analysis run."""
    return MarketService.get_market_analyses(db, analysis_run_id)


@router.get("/competitors/{analysis_run_id}", response_model=list[CompetitorAnalysisResponse])
def get_competitor_analyses(analysis_run_id: UUID, db: Session = Depends(get_session)):
    """Get competitor analyses for an analysis run."""
    return MarketService.get_competitor_analyses(db, analysis_run_id)


# ------------------------------------------------------------------ #
# Markets (dynamic path LAST)
# ------------------------------------------------------------------ #


@router.get("", response_model=list[MarketResponse])
def list_markets(
    market_type: str | None = Query(default=None, description="Filter by market type"),
    location_id: UUID | None = Query(default=None, description="Filter by village location UUID"),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_session),
):
    """List markets with optional filters."""
    return MarketService.get_markets(
        db, market_type=market_type, location_id=location_id, limit=limit
    )


@router.get("/{market_id}", response_model=MarketResponse)
def get_market(market_id: UUID, db: Session = Depends(get_session)):
    """Get a single market by ID."""
    market = MarketService.get_market_by_id(db, market_id)
    if not market:
        raise HTTPException(status_code=404, detail=f"Market {market_id} not found")
    return market
