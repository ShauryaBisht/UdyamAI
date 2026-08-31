"""Market Service for UdyamAI.

Provides reusable data-access functions for Market, MarketPrice,
MarketAnalysis, and CompetitorAnalysis domain data, as well as the
master Market Analysis orchestrator.
"""

from datetime import date
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import or_
from sqlmodel import Session, col, select

from app.geo.nearby_businesses import find_nearby_businesses
from app.geo.nearby_facilities import find_nearby_facilities
from app.geo.nearby_markets import find_nearby_markets
from app.geo.nearby_villages import find_nearby_villages
from app.market.competition import analyze_competition
from app.market.demand import calculate_demand_indicators
from app.market.infrastructure import analyze_relevant_infrastructure
from app.market.market_size import (
    calculate_population_and_household_reach,
    estimate_target_customers,
)
from app.market.pricing import analyze_market_pricing
from app.market.purchasing_power import estimate_purchasing_power
from app.market.risks import assess_market_risks
from app.models.agriculture import Agriculture
from app.models.economic import EconomicIndicator
from app.models.location import Population, Village
from app.models.market import CompetitorAnalysis, Market, MarketAnalysis, MarketPrice
from app.schemas.market import (
    LocationMarketAnalysisResponse,
    MarketProvenanceInfo,
    NearbyInfrastructureSummary,
    NearbyMarketSummary,
    RadiusMarketAnalysisResult,
)


class MarketService:
    # ------------------------------------------------------------------ #
    # Markets
    # ------------------------------------------------------------------ #

    @staticmethod
    def get_markets(
        db: Session,
        market_type: str | None = None,
        location_id: UUID | None = None,
        limit: int = 50,
    ) -> list[Market]:
        """List markets with optional filters.

        Args:
            db: Database session.
            market_type: Filter by market type (e.g. "mandi", "retail").
            location_id: Filter by village location UUID.
            limit: Maximum results (default 50, max 200).
        """
        limit = min(limit, 200)
        statement = select(Market).order_by(Market.name)

        if market_type is not None:
            statement = statement.where(Market.market_type == market_type)
        if location_id is not None:
            statement = statement.where(Market.location_id == location_id)

        statement = statement.limit(limit)
        return db.exec(statement).all()

    @staticmethod
    def get_market_by_id(db: Session, market_id: UUID) -> Market | None:
        """Get a single market by ID."""
        return db.get(Market, market_id)

    # ------------------------------------------------------------------ #
    # Market Prices
    # ------------------------------------------------------------------ #

    @staticmethod
    def get_market_prices(
        db: Session,
        market_id: UUID | None = None,
        location_id: UUID | None = None,
        commodity: str | None = None,
        recorded_date: date | None = None,
        limit: int = 100,
    ) -> list[MarketPrice]:
        """List market prices with optional filters.

        Args:
            db: Database session.
            market_id: Filter by market UUID.
            location_id: Filter by village location UUID.
            commodity: Filter by commodity name (exact match).
            recorded_date: Filter by exact recorded date.
            limit: Maximum results (default 100, max 500).
        """
        limit = min(limit, 500)
        statement = select(MarketPrice).order_by(col(MarketPrice.recorded_date).desc())

        if market_id is not None:
            statement = statement.where(MarketPrice.market_id == market_id)
        if location_id is not None:
            statement = statement.where(MarketPrice.location_id == location_id)
        if commodity is not None:
            statement = statement.where(MarketPrice.commodity == commodity)
        if recorded_date is not None:
            statement = statement.where(MarketPrice.recorded_date == recorded_date)

        statement = statement.limit(limit)
        return db.exec(statement).all()

    @staticmethod
    def get_price_history(
        db: Session,
        commodity: str,
        market_id: UUID | None = None,
        location_id: UUID | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
        limit: int = 365,
    ) -> list[MarketPrice]:
        """Get price history for a commodity over time."""
        limit = min(limit, 1000)
        statement = (
            select(MarketPrice)
            .where(MarketPrice.commodity == commodity)
            .order_by(col(MarketPrice.recorded_date).asc())
        )

        if market_id is not None:
            statement = statement.where(MarketPrice.market_id == market_id)
        if location_id is not None:
            statement = statement.where(MarketPrice.location_id == location_id)
        if start_date is not None:
            statement = statement.where(MarketPrice.recorded_date >= start_date)
        if end_date is not None:
            statement = statement.where(MarketPrice.recorded_date <= end_date)

        statement = statement.limit(limit)
        return db.exec(statement).all()

    @staticmethod
    def get_latest_prices(
        db: Session,
        market_id: UUID | None = None,
        location_id: UUID | None = None,
        limit: int = 50,
    ) -> list[MarketPrice]:
        """Get the most recent price entry for each commodity at a market/location."""
        limit = min(limit, 200)
        from sqlalchemy import func

        subq = select(
            MarketPrice.commodity,
            func.max(MarketPrice.recorded_date).label("latest_date"),
        ).group_by(MarketPrice.commodity)

        if market_id is not None:
            subq = subq.where(MarketPrice.market_id == market_id)
        if location_id is not None:
            subq = subq.where(MarketPrice.location_id == location_id)

        subq = subq.subquery()

        statement = (
            select(MarketPrice)
            .join(
                subq,
                (MarketPrice.commodity == subq.c.commodity)
                & (MarketPrice.recorded_date == subq.c.latest_date),
            )
            .order_by(MarketPrice.commodity)
            .limit(limit)
        )

        return db.exec(statement).all()

    # ------------------------------------------------------------------ #
    # Market Analyses Data Access
    # ------------------------------------------------------------------ #

    @staticmethod
    def get_market_analyses(
        db: Session,
        analysis_run_id: UUID,
    ) -> list[MarketAnalysis]:
        """Get market analyses for a given analysis run."""
        statement = (
            select(MarketAnalysis)
            .where(MarketAnalysis.analysis_run_id == analysis_run_id)
            .order_by(MarketAnalysis.created_at)
        )
        return db.exec(statement).all()

    @staticmethod
    def get_competitor_analyses(
        db: Session,
        analysis_run_id: UUID,
    ) -> list[CompetitorAnalysis]:
        """Get competitor analyses for a given analysis run."""
        statement = (
            select(CompetitorAnalysis)
            .where(CompetitorAnalysis.analysis_run_id == analysis_run_id)
            .order_by(CompetitorAnalysis.created_at)
        )
        return db.exec(statement).all()

    # ------------------------------------------------------------------ #
    # Market Analysis Orchestration (Phase 6)
    # ------------------------------------------------------------------ #

    @staticmethod
    def analyze_village_market(
        db: Session,
        village_id: UUID,
        radii_km: list[float] | None = None,
        business_category_id: UUID | None = None,
        analysis_run_id: UUID | None = None,
    ) -> LocationMarketAnalysisResponse:
        """Perform comprehensive market analysis for a target village location across configurable radii.

        Calculates estimated population reach, estimated household reach, addressable target customers,
        nearby markets, relevant infrastructure, market indicators, and preserves data provenance.
        """
        if radii_km is None or len(radii_km) == 0:
            radii_km = [5.0, 10.0]

        village = db.get(Village, village_id)
        if not village:
            raise HTTPException(status_code=404, detail=f"Village with id {village_id} not found")

        lat = village.latitude if village.latitude is not None else 19.75
        lng = village.longitude if village.longitude is not None else 75.71

        district_name = (
            village.district.name if hasattr(village, "district") and village.district else None
        )
        taluka_name = village.taluka.name if hasattr(village, "taluka") and village.taluka else None

        radius_results: list[RadiusMarketAnalysisResult] = []
        global_provenance: dict[str, MarketProvenanceInfo] = {}

        for r in radii_km:
            # 1. Nearby villages
            nearby_villages = find_nearby_villages(db, lat=lat, lng=lng, radius_km=r, limit=200)
            village_ids = [UUID(str(v["id"])) for v in nearby_villages if "id" in v and v["id"]]
            if village_id not in village_ids:
                village_ids.append(village_id)
                nearby_villages.append(
                    {
                        "id": village.id,
                        "name": village.name,
                        "latitude": village.latitude,
                        "longitude": village.longitude,
                        "distance_meters": 0.0,
                    }
                )

            # Fetch population records for these villages
            pop_records = []
            if village_ids:
                pop_stmt = select(Population).where(Population.location_id.in_(village_ids))
                pop_records = db.exec(pop_stmt).all()

            pop_map = {}
            for pr in pop_records:
                pop_map[str(pr.location_id)] = {
                    "population_total": pr.population_total,
                    "households": pr.households,
                    "working_population": pr.working_population,
                    "source": pr.source,
                    "source_url": pr.source_url,
                    "data_year": pr.data_year,
                }

            pop_res = calculate_population_and_household_reach(nearby_villages, pop_map)
            pop_reach = pop_res["estimated_population_reach"]
            hh_reach = pop_res["estimated_household_reach"]
            target_cust = estimate_target_customers(pop_reach, hh_reach, conversion_rate=0.05)

            # 2. Nearby markets & prices
            nearby_mkts = find_nearby_markets(db, lat=lat, lng=lng, radius_km=r, limit=100)
            market_ids = [UUID(str(m["id"])) for m in nearby_mkts if "id" in m and m["id"]]

            conds = []
            if market_ids:
                conds.append(MarketPrice.market_id.in_(market_ids))
            if village_ids:
                conds.append(MarketPrice.location_id.in_(village_ids))

            mkt_prices_raw = []
            if conds:
                price_stmt = select(MarketPrice).where(or_(*conds)).limit(200)
                mkt_prices_raw = db.exec(price_stmt).all()

            mkt_prices = [
                {k: v for k, v in p.__dict__.items() if not k.startswith("_")}
                for p in mkt_prices_raw
            ]

            market_summaries = []
            for m in nearby_mkts:
                dist_km = round((m.get("distance_meters") or 0.0) / 1000.0, 2)
                m_id = m.get("id")
                sample_p = next((p for p in mkt_prices if p.get("market_id") == m_id), None)
                market_summaries.append(
                    NearbyMarketSummary(
                        id=m_id,
                        name=m.get("name"),
                        market_type=m.get("market_type"),
                        distance_km=dist_km,
                        modal_price_sample=sample_p.get("modal_price") if sample_p else None,
                        commodity_sample=sample_p.get("commodity") if sample_p else None,
                    )
                )

            # 3. Relevant Infrastructure
            nearby_facs = find_nearby_facilities(db, lat=lat, lng=lng, radius_km=r, limit=100)
            infra_res = analyze_relevant_infrastructure(nearby_facs)
            infra_summaries = [
                NearbyInfrastructureSummary(
                    id=item.get("id"),
                    name=item.get("name"),
                    facility_type=item.get("facility_type"),
                    distance_km=item.get("distance_km", 0.0),
                    capacity=item.get("capacity"),
                )
                for item in infra_res["facility_summaries"]
            ]

            # 4. Competition & Businesses
            nearby_biz = find_nearby_businesses(
                db, lat=lat, lng=lng, radius_km=r, category_id=business_category_id, limit=200
            )
            comp_res = analyze_competition(
                nearby_biz,
                radius_km=r,
                target_category_id=str(business_category_id) if business_category_id else None,
            )

            # 5. Indicators & Pricing
            pricing_res = analyze_market_pricing(nearby_mkts, mkt_prices)

            econ_recs = []
            if village_ids:
                econ_stmt = select(EconomicIndicator).where(
                    EconomicIndicator.location_id.in_(village_ids)
                )
                econ_recs = [
                    {k: v for k, v in e.__dict__.items() if not k.startswith("_")}
                    for e in db.exec(econ_stmt).all()
                ]

            agri_recs = []
            if village_ids:
                agri_stmt = select(Agriculture).where(Agriculture.location_id.in_(village_ids))
                agri_recs = [
                    {k: v for k, v in a.__dict__.items() if not k.startswith("_")}
                    for a in db.exec(agri_stmt).all()
                ]

            demand_res = calculate_demand_indicators(
                pop_reach,
                hh_reach,
                pop_res["estimated_working_population"],
                econ_recs,
                agri_recs,
                radius_km=r,
            )
            pp_res = estimate_purchasing_power(
                pop_reach, hh_reach, pop_res["estimated_working_population"], econ_recs
            )
            risk_res = assess_market_risks(
                comp_res["competition_density_per_km2"],
                infra_res["facility_counts_by_type"],
                pricing_res["price_volatility"],
                pop_reach,
            )

            indicators_dict = {
                "demand": demand_res,
                "pricing": pricing_res,
                "competition": comp_res,
                "purchasing_power": pp_res,
                "risks": risk_res,
            }

            # Gather provenance
            radius_provenance_list = []
            for prov_group in (
                pop_res.get("provenance", []),
                infra_res.get("provenance", []),
                comp_res.get("provenance", []),
                pricing_res.get("provenance", []),
            ):
                for p in prov_group:
                    prov_obj = MarketProvenanceInfo(
                        dataset_name=p.get("dataset_name", "Unknown Dataset"),
                        source=p.get("source"),
                        source_url=p.get("source_url"),
                        data_year=p.get("data_year"),
                        record_count=p.get("record_count", 0),
                        confidence_score=p.get("confidence_score", "medium"),
                    )
                    radius_provenance_list.append(prov_obj)
                    global_provenance[prov_obj.dataset_name] = prov_obj

            radius_result = RadiusMarketAnalysisResult(
                radius_km=r,
                estimated_population_reach=pop_reach,
                estimated_household_reach=hh_reach,
                estimated_target_customers=target_cust,
                nearby_villages_count=len(nearby_villages),
                nearby_markets_count=len(nearby_mkts),
                nearby_markets=market_summaries,
                relevant_infrastructure_count=len(nearby_facs),
                relevant_infrastructure=infra_summaries,
                market_indicators=indicators_dict,
                provenance=radius_provenance_list,
            )
            radius_results.append(radius_result)

            # Save DB record if analysis_run_id is provided
            if analysis_run_id is not None:
                db_analysis = MarketAnalysis(
                    analysis_run_id=analysis_run_id,
                    radius_km=r,
                    population_estimate=pop_reach,
                    household_estimate=hh_reach,
                    market_reach_estimate=target_cust,
                    competitor_count=comp_res["total_businesses_in_radius"],
                    demand_indicators=demand_res,
                    distribution_channels={
                        "markets_count": len(nearby_mkts),
                        "infrastructure_count": len(nearby_facs),
                    },
                    pricing_indicators=pricing_res,
                    market_gaps={"identified_gaps": comp_res["identified_market_gaps"]},
                    data_confidence="high" if pop_reach > 0 else "medium",
                )
                db.add(db_analysis)

        if analysis_run_id is not None:
            db.commit()

        return LocationMarketAnalysisResponse(
            village_id=village.id,
            village_name=village.name,
            district_name=district_name,
            taluka_name=taluka_name,
            latitude=village.latitude,
            longitude=village.longitude,
            radii_km=radii_km,
            radius_analyses=radius_results,
            provenance_summary=list(global_provenance.values()),
        )

    # ------------------------------------------------------------------ #
    # Aggregation helpers
    # ------------------------------------------------------------------ #

    @staticmethod
    def get_commodities(
        db: Session,
        market_id: UUID | None = None,
        location_id: UUID | None = None,
    ) -> list[str]:
        """Get distinct commodity names available at a market or location."""
        from sqlalchemy import distinct

        statement = select(distinct(MarketPrice.commodity)).where(
            MarketPrice.commodity.is_not(None)
        )

        if market_id is not None:
            statement = statement.where(MarketPrice.market_id == market_id)
        if location_id is not None:
            statement = statement.where(MarketPrice.location_id == location_id)

        statement = statement.order_by(MarketPrice.commodity)
        return [row[0] for row in db.exec(statement).all()]

    @staticmethod
    def get_market_types(db: Session) -> list[str]:
        """Get distinct market types in the database."""
        from sqlalchemy import distinct

        statement = (
            select(distinct(Market.market_type))
            .where(Market.market_type.is_not(None))
            .order_by(Market.market_type)
        )
        return [row[0] for row in db.exec(statement).all()]
