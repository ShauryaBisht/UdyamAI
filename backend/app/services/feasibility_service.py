"""Feasibility Service for UdyamAI.

Orchestrates data aggregation across Market, Finance, Competition, Infrastructure,
and Risk Indicators domains to generate deterministic feasibility scores and structured SWOT indicators.
"""

import logging
from typing import Any
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlmodel import Session

from app.feasibility.scorer import calculate_feasibility_scores
from app.feasibility.swot import build_swot_indicators
from app.geo.nearby_businesses import find_nearby_businesses
from app.geo.nearby_facilities import find_nearby_facilities
from app.geo.nearby_markets import find_nearby_markets
from app.geo.nearby_villages import find_nearby_villages
from app.market.competition import analyze_competition
from app.market.infrastructure import analyze_relevant_infrastructure
from app.market.risks import assess_market_risks
from app.models.location import Village
from app.schemas.feasibility import FeasibilityScoreResult, SWOTIndicators

logger = logging.getLogger(__name__)


def _get_entity_by_id(db: Session, model_cls: type, entity_id: UUID) -> Any:
    """Safely retrieves an entity by ID supporting SQLModel Session, SQLAlchemy 2.0, and legacy Session APIs."""
    try:
        return db.get(model_cls, entity_id)
    except AttributeError:
        res = db.execute(select(model_cls).where(model_cls.id == entity_id))
        return res.scalars().first()


class FeasibilityService:
    """Orchestrates deterministic feasibility calculations."""

    @staticmethod
    def calculate_feasibility(
        db: Session,
        village_id: UUID | None = None,
        lat: float | None = None,
        lng: float | None = None,
        radius_km: float = 10.0,
        business_category_id: UUID | None = None,
        available_capital: float = 0.0,
        desired_project_cost: float = 0.0,
    ) -> FeasibilityScoreResult:
        """Perform unified feasibility analysis for a location and project parameters."""
        target_lat = lat
        target_lng = lng

        if (target_lat is None or target_lng is None) and village_id is not None:
            village = _get_entity_by_id(db, Village, village_id)
            if not village:
                raise HTTPException(
                    status_code=404, detail=f"Village with id {village_id} not found"
                )
            if village.latitude is None or village.longitude is None:
                raise HTTPException(
                    status_code=400,
                    detail=f"Village '{village.name}' (id {village_id}) is missing latitude/longitude coordinates.",
                )
            target_lat = village.latitude
            target_lng = village.longitude

        if target_lat is None or target_lng is None:
            raise HTTPException(
                status_code=400,
                detail="Location coordinates (lat, lng) or a valid village_id are required for feasibility calculation.",
            )

        # Retrieve empirical spatial data
        nearby_biz = find_nearby_businesses(
            db, lat=target_lat, lng=target_lng, radius_km=radius_km, limit=500
        )
        nearby_facs = find_nearby_facilities(
            db, lat=target_lat, lng=target_lng, radius_km=radius_km, limit=500
        )
        nearby_mkts = find_nearby_markets(
            db, lat=target_lat, lng=target_lng, radius_km=radius_km, limit=50
        )
        nearby_vils = find_nearby_villages(
            db, lat=target_lat, lng=target_lng, radius_km=radius_km, limit=500
        )

        # 1. Market metrics
        pop_reach = sum(v.get("population", 0) or 0 for v in nearby_vils)
        hh_reach = int(pop_reach / 5.0)

        nearest_dist = (
            min([m.get("distance_meters", 100000) / 1000.0 for m in nearby_mkts])
            if nearby_mkts
            else None
        )
        single_mkt_name = nearby_mkts[0].get("name") if len(nearby_mkts) == 1 else None

        # 2. Competition metrics
        comp_res = analyze_competition(nearby_biz, radius_km=radius_km)
        if not isinstance(comp_res, dict):
            logger.warning("analyze_competition returned unexpected type: %r", comp_res)
            comp_res = {}
        calc_comp_density = float(comp_res.get("competition_density_per_km2", 0.0) or 0.0)

        # 3. Infrastructure metrics
        infra_res = analyze_relevant_infrastructure(nearby_facs)
        if not isinstance(infra_res, dict):
            logger.warning(
                "analyze_relevant_infrastructure returned unexpected type: %r", infra_res
            )
            infra_res = {"facility_counts_by_type": {}}
        facility_counts = infra_res.get("facility_counts_by_type", {}) or {}

        # 4. Risk indicators
        risk_res = assess_market_risks(
            competition_density=calc_comp_density,
            facility_counts=facility_counts,
            population_reach=pop_reach,
            nearby_markets_count=len(nearby_mkts),
            nearest_market_distance_km=nearest_dist,
            single_market_name=single_mkt_name,
            radius_km=radius_km,
        )
        engine_risk_score = float(risk_res.get("risk_score", 0.0))
        risk_flags = risk_res.get("identified_risk_flags", [])

        # 5. Financial subsidy placeholder estimation (can be enriched by SchemeService)
        est_subsidy = 0.0
        if desired_project_cost > 0:
            est_subsidy = min(desired_project_cost * 0.35, 350000.0)

        # Calculate sub-scores & overall score
        scores = calculate_feasibility_scores(
            population_reach=pop_reach,
            household_reach=hh_reach,
            nearest_market_distance_km=nearest_dist,
            nearby_markets_count=len(nearby_mkts),
            available_capital=available_capital,
            desired_project_cost=desired_project_cost,
            estimated_subsidy=est_subsidy,
            competition_density=calc_comp_density,
            facility_counts=facility_counts,
            engine_risk_score=engine_risk_score,
        )

        # Build SWOT indicators for AI narrative
        swot_dict = build_swot_indicators(
            market_scores=scores,
            population_reach=pop_reach,
            household_reach=hh_reach,
            available_capital=available_capital,
            desired_project_cost=desired_project_cost,
            estimated_subsidy=est_subsidy,
            competition_density=calc_comp_density,
            facility_counts=facility_counts,
            identified_risk_flags=risk_flags,
            nearest_market_distance_km=nearest_dist,
        )

        return FeasibilityScoreResult(
            market_score=scores["market_score"],
            financial_score=scores["financial_score"],
            competition_score=scores["competition_score"],
            infrastructure_score=scores["infrastructure_score"],
            risk_score=scores["risk_score"],
            overall_score=scores["overall_score"],
            swot=SWOTIndicators(
                strength_indicators=swot_dict["strength_indicators"],
                weakness_indicators=swot_dict["weakness_indicators"],
                opportunity_indicators=swot_dict["opportunity_indicators"],
                threat_indicators=swot_dict["threat_indicators"],
            ),
        )
