"""Sample village demo endpoint.

Provides a deterministic, comprehensive demo dataset for showcases, onboarding previews,
and zero-friction testing without requiring initial user input or external API keys.
All data is marked with `is_demo: True`.
"""

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class SampleVillageDemoResponse(BaseModel):
    is_demo: bool = Field(default=True, description="Indicates synthetic demo data")
    scenario_id: str
    village: dict[str, Any]
    entrepreneur: dict[str, Any]
    business_idea: dict[str, Any]
    financial_plan: dict[str, Any]
    schemes: list[dict[str, Any]]
    cash_flow_projection: list[dict[str, Any]]
    feasibility_scores: dict[str, Any]
    risk_factors: list[dict[str, Any]]


DEMO_DATA: dict[str, Any] = {
    "is_demo": True,
    "scenario_id": "demo-ralegan-siddhi-oil-mill-001",
    "village": {
        "name": "Ralegan Siddhi",
        "district": "Ahmednagar",
        "state": "Maharashtra",
        "population": 2350,
        "major_crops": ["Groundnut", "Sunflower", "Soybean", "Millets"],
        "infrastructure": {
            "power_hours_per_day": 20,
            "road_connectivity": "Paved all-weather road",
            "nearest_mandi_km": 14.5,
            "nearest_bank_branch_km": 3.2,
            "cold_storage_nearby": True,
        },
    },
    "entrepreneur": {
        "name": "Kavita Shinde",
        "age": 32,
        "education": "Higher Secondary (12th Pass)",
        "social_category": "OBC / Women Entrepreneur",
        "prior_experience": "3 years running a local grocery store & SHG member",
        "available_capital": 75000.0,
    },
    "business_idea": {
        "title": "Cold-Pressed Edible Oil Extraction & Packaging",
        "category": "Agro / Food Processing",
        "daily_capacity": "200 Litres cold-pressed oil",
        "primary_outputs": ["Groundnut Oil", "Sunflower Oil", "High-protein Oilcake (Cattle Feed)"],
        "target_customers": [
            "Local Kirana Stores",
            "Direct Village Consumers",
            "Weekly Haat / Taluka Mandi",
        ],
    },
    "financial_plan": {
        "total_project_cost": 750000.0,
        "own_equity": 75000.0,
        "equity_percentage": 10.0,
        "subsidy_amount": 262500.0,
        "subsidy_percentage": 35.0,
        "bank_term_loan": 412500.0,
        "loan_interest_rate_percent": 8.5,
        "tenure_months": 60,
        "monthly_emi": 8467.0,
        "break_even_months": 9,
        "annual_projected_roi_percent": 24.5,
    },
    "schemes": [
        {
            "scheme_name": "PMEGP (Rural Special Category - Women)",
            "ministry": "Ministry of MSME",
            "subsidy_percent": 35.0,
            "subsidy_amount": 262500.0,
            "eligibility_status": "Eligible",
            "reason": "Rural woman entrepreneur setting up manufacturing/agro unit under ₹25 Lakh.",
        },
        {
            "scheme_name": "PMFME (Micro Food Processing Enterprises)",
            "ministry": "Ministry of Food Processing Industries",
            "subsidy_percent": 35.0,
            "subsidy_amount": 262500.0,
            "eligibility_status": "Eligible",
            "reason": "One District One Product (ODOP) alignment for Ahmednagar oilseed processing.",
        },
        {
            "scheme_name": "MUDRA Yojana (Kishore Category)",
            "ministry": "Department of Financial Services",
            "max_loan": 500000.0,
            "collateral_required": False,
            "eligibility_status": "Eligible Alternative",
            "reason": "Working capital facility without collateral security requirement.",
        },
    ],
    "cash_flow_projection": [
        {
            "month": 1,
            "revenue": 48000.0,
            "operating_expenses": 34000.0,
            "emi": 8467.0,
            "net_cash_flow": 5533.0,
        },
        {
            "month": 3,
            "revenue": 88000.0,
            "operating_expenses": 52000.0,
            "emi": 8467.0,
            "net_cash_flow": 27533.0,
        },
        {
            "month": 6,
            "revenue": 142000.0,
            "operating_expenses": 76000.0,
            "emi": 8467.0,
            "net_cash_flow": 57533.0,
        },
        {
            "month": 9,
            "revenue": 175000.0,
            "operating_expenses": 91000.0,
            "emi": 8467.0,
            "net_cash_flow": 75533.0,
        },
        {
            "month": 12,
            "revenue": 210000.0,
            "operating_expenses": 105000.0,
            "emi": 8467.0,
            "net_cash_flow": 96533.0,
        },
    ],
    "feasibility_scores": {
        "raw_material_availability": 94.0,
        "local_demand_score": 86.0,
        "financial_viability_score": 88.0,
        "infrastructure_score": 82.0,
        "overall_feasibility_percent": 87.5,
        "grade": "Tier 1 — Highly Feasible",
    },
    "risk_factors": [
        {
            "risk": "Seasonal raw material price fluctuations during non-harvest seasons",
            "severity": "Medium",
            "mitigation_strategy": "Establish forward buying contracts with local Farmer Producer Organizations (FPOs).",
        },
        {
            "risk": "Initial working capital crunch before cash cycle stabilizes",
            "severity": "Low-Medium",
            "mitigation_strategy": "Utilize MUDRA working capital cash credit limit of ₹1,00,000 for seed inventory.",
        },
    ],
}


@router.get("/sample-village", response_model=SampleVillageDemoResponse)
@router.post("/sample-village", response_model=SampleVillageDemoResponse)
def get_sample_village_demo() -> SampleVillageDemoResponse:
    """Return comprehensive demo dataset for instant evaluation."""
    return SampleVillageDemoResponse(**DEMO_DATA)
