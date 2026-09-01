"""Analysis Orchestrator for UdyamAI.

Coordinates the end-to-end multi-step analysis pipeline:
1. Validate input
2. Create AnalysisRun
3. Fetch location
4. Fetch business category
5. Run finance
6. Run market analysis
7. Run competition analysis
8. Obtain scheme matches
9. Run feasibility
10. Build AnalysisContext
11. Hand context to AI Advisor
12. Save final results
"""

import logging
from datetime import UTC, datetime

from fastapi import HTTPException
from sqlmodel import Session

from app.ai import advisor
from app.models.analysis import AIAnalysis, AnalysisRun, FeasibilityAnalysis
from app.models.business import BusinessCategory
from app.models.location import District, Taluka, Village
from app.models.market import CompetitorAnalysis, MarketAnalysis
from app.models.report import Report
from app.models.scheme import SchemeMatch
from app.models.user import Profile
from app.schemas.ai import (
    AnalysisContext,
    BusinessContext,
    CompetitionContext,
    FeasibilityContext,
    LocationContext,
    MarketContext,
    RiskContext,
    SchemeMatchContext,
)
from app.schemas.business import BusinessCategoryResponse
from app.schemas.common import SchemeMatchStatus
from app.schemas.feasibility import AnalysisRunCreate
from app.schemas.finance import FinanceCalculateRequest
from app.schemas.location import DistrictResponse, TalukaResponse, VillageResponse
from app.schemas.scheme import SchemeResponse
from app.services.analysis_service import AnalysisService
from app.services.feasibility_service import FeasibilityService
from app.services.finance_service import FinanceService
from app.services.market_service import MarketService
from app.services.scheme_service import SchemeService

logger = logging.getLogger(__name__)

SUPPORTED_LANGUAGES = {"en", "hi", "mr"}


class AnalysisOrchestrator:
    """Orchestrates the central 12-step analysis workflow with strict transaction boundaries."""

    @staticmethod
    def run_analysis_pipeline(db: Session, run_data: AnalysisRunCreate) -> AnalysisRun:
        logger.info("Starting Analysis Orchestrator pipeline")

        category: BusinessCategory | None = None
        village: Village | None = None
        taluka: Taluka | None = None
        district: District | None = None

        # -------------------------------------------------------------
        # Step 1: Validate input
        # -------------------------------------------------------------
        raw_location = run_data.location_id or run_data.village_id
        if not raw_location:
            raise HTTPException(
                status_code=400,
                detail="Location identifier (location_id or village_id) is required",
            )

        location_id = AnalysisService.verify_location(db, raw_location)
        category_id = None
        if run_data.business_category_id:
            category_id = AnalysisService.verify_business_category(
                db, run_data.business_category_id
            )

        # Require valid user_id (reject missing profile or unauthenticated requests)
        user_id = run_data.user_id
        if user_id is None:
            raise HTTPException(
                status_code=400,
                detail="User identifier (user_id) is required for analysis run",
            )

        profile = db.get(Profile, user_id)
        if not profile:
            raise HTTPException(
                status_code=404,
                detail=f"User profile with ID {user_id} not found",
            )

        # -------------------------------------------------------------
        # Step 2: Create AnalysisRun
        # -------------------------------------------------------------
        db_run = AnalysisRun(
            user_id=user_id,
            location_id=location_id,
            business_category_id=category_id,
            available_capital=run_data.available_capital or 0.0,
            status="running",
        )
        db.add(db_run)
        db.commit()
        db.refresh(db_run)

        try:
            # -------------------------------------------------------------
            # Step 3: Fetch location
            # -------------------------------------------------------------
            village = db.get(Village, location_id)
            if not village:
                raise HTTPException(
                    status_code=404,
                    detail=f"Village with ID {location_id} not found",
                )

            taluka = db.get(Taluka, village.taluka_id) if village.taluka_id else None
            if not taluka and village.taluka_id:
                raise HTTPException(
                    status_code=404,
                    detail=f"Taluka with ID {village.taluka_id} not found",
                )

            district = (
                db.get(District, taluka.district_id) if taluka and taluka.district_id else None
            )
            if not district and taluka and taluka.district_id:
                raise HTTPException(
                    status_code=404,
                    detail=f"District associated with Taluka {taluka.id} not found",
                )

            # -------------------------------------------------------------
            # Step 4: Fetch business category
            # -------------------------------------------------------------
            category = db.get(BusinessCategory, category_id) if category_id else None
            if not category:
                raise HTTPException(
                    status_code=400,
                    detail="Business category is required for analysis. Please specify business_category_id.",
                )

            # -------------------------------------------------------------
            # Step 5: Run finance
            # -------------------------------------------------------------
            desired_cost = run_data.desired_project_cost or 200_000.0
            avail_cap = run_data.available_capital or 50_000.0

            finance_req = FinanceCalculateRequest(
                desired_project_cost=desired_cost,
                available_capital=avail_cap,
                loan_percent=75.0,
                interest_rate=8.5,
                tenure_months=60,
                moratorium_months=6,
                analysis_run_id=db_run.id,
            )
            financial_calc = FinanceService.calculate_finance(finance_req, session=db)

            # -------------------------------------------------------------
            # Step 6: Run market analysis
            # -------------------------------------------------------------
            market_location_res = MarketService.analyze_village_market(
                db,
                village_id=village.id,
                business_category_id=category.id,
                radii_km=[10.0],
            )
            if not getattr(market_location_res, "radius_results", None):
                raise HTTPException(
                    status_code=422,
                    detail="Market analysis returned no radius results for the given location.",
                )
            market_res = market_location_res.radius_results[0]

            # -------------------------------------------------------------
            # Step 7: Run competition analysis
            # -------------------------------------------------------------
            competition_res = MarketService.analyze_competition_for_location(
                db,
                village_id=village.id,
                business_category_id=category.id,
                radius_km=10.0,
            )

            # -------------------------------------------------------------
            # Step 8: Obtain scheme matches
            # -------------------------------------------------------------
            db_scheme_matches = SchemeService.get_scheme_matches(db, db_run.id)
            if not db_scheme_matches:
                active_schemes = SchemeService.get_schemes(db, limit=10)
                db_scheme_matches = []
                for sch in active_schemes:
                    if sch.id is not None:
                        match_item = SchemeMatch(
                            analysis_run_id=db_run.id,
                            scheme_id=sch.id,
                            match_status=SchemeMatchStatus.POTENTIAL_MATCH,
                            match_score=0.85,
                            matched_conditions={"category": True, "location": True},
                            estimated_loan_amount=desired_cost * 0.75,
                            estimated_project_cost=desired_cost,
                            verification_required=True,
                        )
                        db.add(match_item)
                        db_scheme_matches.append(match_item)
                if db_scheme_matches:
                    db.commit()

            # -------------------------------------------------------------
            # Step 9: Run feasibility
            # -------------------------------------------------------------
            feasibility_score_res = FeasibilityService.calculate_feasibility(
                db,
                village_id=village.id,
                business_category_id=category.id,
                available_capital=avail_cap,
                desired_project_cost=desired_cost,
            )

            # -------------------------------------------------------------
            # Step 10: Build AnalysisContext
            # -------------------------------------------------------------
            loc_context = LocationContext(
                village=VillageResponse.model_validate(village),
                district=DistrictResponse.model_validate(district) if district else None,
                taluka=TalukaResponse.model_validate(taluka) if taluka else None,
            )
            biz_context = BusinessContext(
                category=BusinessCategoryResponse.model_validate(category)
            )

            mkt_context = MarketContext(
                population_estimate=getattr(market_res.market_size, "total_population_reach", None),
                household_estimate=getattr(market_res.market_size, "household_reach", None),
                market_reach_estimate=getattr(
                    market_res.market_size, "estimated_target_customers", None
                ),
                radius_km=10.0,
                demand_indicators={
                    "score": getattr(market_res, "demand_score", None),
                    "level": getattr(market_res, "demand_level", None),
                    "growth_rate": getattr(market_res, "demand_growth_rate", None),
                },
                pricing_indicators={
                    "average_market_price": getattr(
                        getattr(market_res, "pricing", None), "average_market_price", None
                    ),
                    "price_range_min": getattr(
                        getattr(market_res, "pricing", None), "price_range_min", None
                    ),
                    "price_range_max": getattr(
                        getattr(market_res, "pricing", None), "price_range_max", None
                    ),
                },
            )

            comp_context = CompetitionContext(
                competitor_count=getattr(competition_res, "total_competitors_count", 0),
                competitor_density=getattr(competition_res, "competition_density", 0.0),
                businesses_within_5km=getattr(competition_res, "businesses_within_5km", 0),
                businesses_within_10km=getattr(competition_res, "businesses_within_10km", 0),
                total_businesses_in_radius=getattr(
                    competition_res, "total_businesses_in_radius", 0
                ),
                target_category=getattr(category, "name", None) if category else None,
            )

            scheme_contexts = []
            for match in db_scheme_matches:
                sch_obj = SchemeService.get_scheme_by_id(db, match.scheme_id)
                if sch_obj:
                    scheme_contexts.append(
                        SchemeMatchContext(
                            scheme=SchemeResponse.model_validate(sch_obj),
                            match_status=match.match_status,
                            match_score=match.match_score,
                            matched_conditions=match.matched_conditions,
                            failed_conditions=match.failed_conditions,
                            missing_information=match.missing_information,
                            estimated_loan_amount=match.estimated_loan_amount,
                            estimated_project_cost=match.estimated_project_cost,
                            verification_required=match.verification_required,
                        )
                    )

            feasibility_context = FeasibilityContext(
                overall_score=feasibility_score_res.overall_score,
                market_score=feasibility_score_res.market_score,
                financial_score=feasibility_score_res.financial_score,
                competition_score=feasibility_score_res.competition_score,
                infrastructure_score=feasibility_score_res.infrastructure_score,
                risk_score=feasibility_score_res.risk_score,
                swot=feasibility_score_res.swot,
            )

            # Safely extract optional language property with default fallback and validation guard
            lang_attr = getattr(run_data, "language", None)
            lang_str = str(getattr(lang_attr, "value", lang_attr)) if lang_attr else "en"
            if lang_str not in SUPPORTED_LANGUAGES:
                logger.warning("Unsupported language %s, defaulting to 'en'", lang_str)
                lang_str = "en"

            mkt_risks = getattr(market_res, "risks", None)
            mkt_risk_score = (
                getattr(mkt_risks, "overall_market_risk_score", 0.0) if mkt_risks else 0.0
            )
            mkt_risk_level = getattr(mkt_risks, "risk_level", "low") if mkt_risks else "low"
            comp_threat_level = (
                getattr(competition_res, "threat_level", "low") if competition_res else "low"
            )

            risks_context = [
                RiskContext(
                    risk_type="market_risk",
                    score=mkt_risk_score,
                    level=mkt_risk_level,
                ),
                RiskContext(
                    risk_type="competition_threat",
                    score=None,
                    level=comp_threat_level,
                ),
            ]

            analysis_context = AnalysisContext(
                location=loc_context,
                business=biz_context,
                financial=financial_calc,
                market=mkt_context,
                competition=comp_context,
                schemes=scheme_contexts,
                feasibility=feasibility_context,
                risks=risks_context,
                language=lang_str,
            )

            # -------------------------------------------------------------
            # Step 11: Hand context to AI Advisor
            # -------------------------------------------------------------
            ai_advice = advisor.generate_advice(
                analysis_context=analysis_context, language=lang_str, db=db
            )

            # -------------------------------------------------------------
            # Step 12: Save final results
            # -------------------------------------------------------------
            db_feasibility = FeasibilityAnalysis(
                analysis_run_id=db_run.id,
                market_score=feasibility_score_res.market_score,
                financial_score=feasibility_score_res.financial_score,
                competition_score=feasibility_score_res.competition_score,
                infrastructure_score=feasibility_score_res.infrastructure_score,
                risk_score=feasibility_score_res.risk_score,
                overall_score=feasibility_score_res.overall_score,
                recommendation=ai_advice.recommendation,
                strengths={
                    "indicators": getattr(
                        feasibility_score_res.swot,
                        "strengths",
                        getattr(feasibility_score_res.swot, "strength_indicators", []),
                    )
                },
                weaknesses={
                    "indicators": getattr(
                        feasibility_score_res.swot,
                        "weaknesses",
                        getattr(feasibility_score_res.swot, "weakness_indicators", []),
                    )
                },
                opportunities={
                    "indicators": getattr(
                        feasibility_score_res.swot,
                        "opportunities",
                        getattr(feasibility_score_res.swot, "opportunity_indicators", []),
                    )
                },
                threats={
                    "indicators": getattr(
                        feasibility_score_res.swot,
                        "threats",
                        getattr(feasibility_score_res.swot, "threat_indicators", []),
                    )
                },
                confidence=ai_advice.confidence,
                scoring_version="v1.0",
            )
            db.add(db_feasibility)

            db_ai = AIAnalysis(
                analysis_run_id=db_run.id,
                summary=ai_advice.summary,
                recommendation=ai_advice.recommendation,
                swot={
                    "strengths": ai_advice.reasoning,
                    "weaknesses": [],
                    "opportunities": ai_advice.market_advice,
                    "threats": ai_advice.risks,
                },
                opportunities={"advice": ai_advice.market_advice},
                threats={"risks": ai_advice.risks},
                risks={"risks": ai_advice.risks},
                pricing_strategy={"financial_advice": ai_advice.financial_advice},
                business_plan={"next_steps": ai_advice.next_steps},
                model_name=ai_advice.model_name,
                prompt_version=ai_advice.prompt_version,
                confidence=ai_advice.confidence,
            )
            db.add(db_ai)

            db_market_analysis = MarketAnalysis(
                analysis_run_id=db_run.id,
                radius_km=10.0,
                population_estimate=market_res.market_size.total_population_reach,
                household_estimate=market_res.market_size.household_reach,
                market_reach_estimate=market_res.market_size.estimated_target_customers,
                competitor_count=competition_res.total_competitors_count,
                demand_indicators={
                    "score": market_res.demand_score,
                    "level": market_res.demand_level,
                },
                pricing_indicators={"average_price": market_res.pricing.average_market_price},
                data_confidence=ai_advice.confidence,
            )
            db.add(db_market_analysis)

            db_competitor_analysis = CompetitorAnalysis(
                analysis_run_id=db_run.id,
                radius_km=10.0,
                competitor_count=competition_res.total_competitors_count,
                competition_density=competition_res.competition_density,
                competitor_distribution={
                    "direct": competition_res.direct_competitors_count,
                    "indirect": competition_res.indirect_competitors_count,
                },
                data_confidence=ai_advice.confidence,
            )
            db.add(db_competitor_analysis)

            category_title = category.name if category else "Business"
            village_title = village.name if village else "Location"
            db_report = Report(
                analysis_run_id=db_run.id,
                user_id=user_id,
                title=f"Analysis Report - {category_title} ({village_title})",
                language=lang_str,
                report_data={
                    "summary": ai_advice.summary,
                    "recommendation": ai_advice.recommendation,
                    "overall_score": feasibility_score_res.overall_score,
                },
            )
            db.add(db_report)

            db_run.status = "completed"
            db_run.completed_at = datetime.now(UTC)
            db.add(db_run)
            db.commit()
            db.refresh(db_run)
            return db_run

        except Exception as exc:
            db.rollback()
            run_id = getattr(db_run, "id", None)
            logger.exception(
                "Error executing analysis orchestrator pipeline for run %s",
                run_id or "unknown",
            )
            try:
                if run_id:
                    failed_run = db.get(AnalysisRun, run_id)
                    if failed_run:
                        failed_run.status = "failed"
                        failed_run.completed_at = datetime.now(UTC)
                        db.add(failed_run)
                        db.commit()
            except Exception as cleanup_exc:
                logger.exception("Failed to update run status to failed: %s", cleanup_exc)
                db.rollback()
            raise exc
