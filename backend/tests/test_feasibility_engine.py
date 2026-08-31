"""Unit and API integration test suite for Phase 9 - Feasibility Engine."""

from unittest.mock import MagicMock, patch
from uuid import uuid4

from app.feasibility.scorer import (
    calculate_competition_score,
    calculate_feasibility_scores,
    calculate_financial_score,
    calculate_infrastructure_score,
    calculate_market_score,
    calculate_risk_safety_score,
)
from app.feasibility.swot import build_swot_indicators
from app.schemas.feasibility import FeasibilityScoreResult
from app.services.feasibility_service import FeasibilityService


class TestFeasibilityScorerEngine:
    """Test deterministic scoring formulas."""

    def test_market_score_calculation(self):
        """Calculates market score bounded in 0-100."""
        score_high = calculate_market_score(
            population_reach=25000,
            household_reach=5000,
            nearest_market_distance_km=3.0,
            nearby_markets_count=2,
        )
        assert score_high == 100.0

        score_low = calculate_market_score(
            population_reach=500,
            household_reach=100,
            nearest_market_distance_km=40.0,
            nearby_markets_count=1,
        )
        assert 0.0 <= score_low < 30.0

    def test_financial_score_calculation(self):
        """Calculates financial equity and subsidy score."""
        # 35% equity contribution + 35% subsidy = 100
        score_max = calculate_financial_score(
            available_capital=350000.0,
            desired_project_cost=1000000.0,
            estimated_subsidy=350000.0,
        )
        assert score_max == 100.0

        # Zero equity, zero subsidy
        score_zero = calculate_financial_score(
            available_capital=0.0,
            desired_project_cost=1000000.0,
            estimated_subsidy=0.0,
        )
        assert score_zero == 0.0

    def test_competition_score_inversion(self):
        """Calculates competition score inversely proportional to competitor density."""
        # Zero density = 100
        assert calculate_competition_score(0.0) == 100.0
        # 2.0 density = 85.0
        assert calculate_competition_score(2.0) == 85.0
        # High density (12.0) = low score
        assert calculate_competition_score(12.0) <= 35.0

    def test_infrastructure_score_calculation(self):
        """Calculates infrastructure score based on facility availability."""
        score_full = calculate_infrastructure_score(
            facility_counts={"bank": 2, "cold_storage": 2, "mandi": 2}
        )
        assert score_full == 100.0

        score_empty = calculate_infrastructure_score(facility_counts={})
        assert score_empty == 0.0

    def test_risk_safety_score_inversion(self):
        """Inverts 0-10 risk engine score to 0-100 safety score."""
        assert calculate_risk_safety_score(0.0) == 100.0
        assert calculate_risk_safety_score(7.5) == 25.0
        assert calculate_risk_safety_score(10.0) == 0.0

    def test_calculate_feasibility_scores_combination(self):
        """Computes all sub-scores and overall score."""
        scores = calculate_feasibility_scores(
            population_reach=15000,
            household_reach=3000,
            nearest_market_distance_km=4.0,
            nearby_markets_count=3,
            available_capital=300000.0,
            desired_project_cost=1000000.0,
            estimated_subsidy=250000.0,
            competition_density=1.5,
            facility_counts={"bank": 1, "cold_storage": 1},
            engine_risk_score=2.0,
        )

        assert "market_score" in scores
        assert "financial_score" in scores
        assert "competition_score" in scores
        assert "infrastructure_score" in scores
        assert "risk_score" in scores
        assert "overall_score" in scores
        assert 0.0 <= scores["overall_score"] <= 100.0


class TestSWOTIndicatorBuilder:
    """Test deterministic SWOT indicators generator."""

    def test_swot_indicators_generation(self):
        """Builds structured SWOT lists from empirical metrics."""
        swot = build_swot_indicators(
            population_reach=15000,
            available_capital=400000.0,
            desired_project_cost=1000000.0,
            estimated_subsidy=250000.0,
            competition_density=1.2,
            facility_counts={"bank": 0, "cold_storage": 0},
            identified_risk_flags=["Price Volatility (MEDIUM): Commodity price fluctuation"],
            matched_scheme_names=["PMEGP"],
            nearest_market_distance_km=15.0,
        )

        assert "strength_indicators" in swot
        assert "weakness_indicators" in swot
        assert "opportunity_indicators" in swot
        assert "threat_indicators" in swot

        assert len(swot["strength_indicators"]) >= 2
        assert len(swot["weakness_indicators"]) >= 2
        assert len(swot["opportunity_indicators"]) >= 1
        assert len(swot["threat_indicators"]) >= 1


class TestFeasibilityServiceOrchestration:
    """Test FeasibilityService orchestration."""

    def test_calculate_feasibility_service(self):
        mock_db = MagicMock()
        mock_db.get.return_value = None

        with (
            patch("app.services.feasibility_service.find_nearby_businesses", return_value=[]),
            patch("app.services.feasibility_service.find_nearby_facilities", return_value=[]),
            patch("app.services.feasibility_service.find_nearby_markets", return_value=[]),
            patch("app.services.feasibility_service.find_nearby_villages", return_value=[]),
        ):
            res = FeasibilityService.calculate_feasibility(
                db=mock_db,
                lat=18.52,
                lng=73.85,
                radius_km=10.0,
                available_capital=200000.0,
                desired_project_cost=500000.0,
            )

            assert isinstance(res, FeasibilityScoreResult)
            assert 0.0 <= res.overall_score <= 100.0
            assert isinstance(res.swot.strength_indicators, list)


class TestFeasibilityAPIEndpoints:
    """Test API route endpoints for Feasibility Engine."""

    def test_post_calculate_feasibility_endpoint(self, client):
        v_id = uuid4()

        with patch(
            "app.api.routes.feasibility.FeasibilityService.calculate_feasibility"
        ) as mock_fn:
            mock_fn.return_value = FeasibilityScoreResult(
                market_score=80.0,
                financial_score=74.0,
                competition_score=68.0,
                infrastructure_score=60.0,
                risk_score=72.0,
                overall_score=71.8,
                swot={
                    "strength_indicators": ["Strong market reach"],
                    "weakness_indicators": [],
                    "opportunity_indicators": [],
                    "threat_indicators": [],
                },
            )

            response = client.post(
                "/feasibility/calculate",
                json={
                    "village_id": str(v_id),
                    "available_capital": 300000.0,
                    "desired_project_cost": 1000000.0,
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert data["market_score"] == 80.0
            assert data["overall_score"] == 71.8
            assert "swot" in data

    def test_get_village_feasibility_endpoint(self, client):
        v_id = uuid4()

        with patch(
            "app.api.routes.feasibility.FeasibilityService.calculate_feasibility"
        ) as mock_fn:
            mock_fn.return_value = FeasibilityScoreResult(
                market_score=85.0,
                financial_score=80.0,
                competition_score=75.0,
                infrastructure_score=70.0,
                risk_score=90.0,
                overall_score=80.0,
                swot={
                    "strength_indicators": ["High demand"],
                    "weakness_indicators": [],
                    "opportunity_indicators": [],
                    "threat_indicators": [],
                },
            )

            response = client.get(f"/feasibility/{v_id}?radius_km=10.0")

            assert response.status_code == 200
            data = response.json()
            assert data["overall_score"] == 80.0
