"""Feasibility Engine API Routes for UdyamAI."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.database import get_session
from app.schemas.feasibility import (
    FeasibilityCalculationRequest,
    FeasibilityScoreResult,
)
from app.services.feasibility_service import FeasibilityService

router = APIRouter()


@router.post("/calculate", response_model=FeasibilityScoreResult)
def calculate_feasibility(req: FeasibilityCalculationRequest, db: Session = Depends(get_session)):
    """Calculate deterministic feasibility sub-scores and SWOT indicators for location/project."""
    return FeasibilityService.calculate_feasibility(
        db=db,
        village_id=req.village_id,
        lat=req.latitude,
        lng=req.longitude,
        radius_km=req.radius_km,
        business_category_id=req.business_category_id,
        available_capital=req.available_capital,
        desired_project_cost=req.desired_project_cost,
    )


@router.get("/{village_id}", response_model=FeasibilityScoreResult)
def get_village_feasibility(
    village_id: UUID,
    radius_km: float = Query(default=10.0, ge=0.1, le=50.0, description="Analysis radius in km"),
    available_capital: float = Query(default=0.0, ge=0.0, description="Available capital in INR"),
    desired_project_cost: float = Query(
        default=0.0, ge=0.0, description="Desired project cost in INR"
    ),
    db: Session = Depends(get_session),
):
    """Get deterministic feasibility score breakdown for a specified village."""
    return FeasibilityService.calculate_feasibility(
        db=db,
        village_id=village_id,
        radius_km=radius_km,
        available_capital=available_capital,
        desired_project_cost=desired_project_cost,
    )
