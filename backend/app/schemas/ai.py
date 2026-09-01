"""Pydantic contracts for the AI Advisor layer.

AnalysisContext = verified input from the backend analysis pipeline.
AIAdvice = structured output returned to the frontend.

This file now mirrors the current shared schema contracts under
backend/app/schemas rather than the older placeholder assumptions.
"""

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.schemas.business import BusinessCategoryResponse, BusinessModelResponse
from app.schemas.common import SchemeMatchStatus
from app.schemas.feasibility import FeasibilityAnalysisResponse
from app.schemas.finance import FinanceCalculateResponse
from app.schemas.location import DistrictResponse, TalukaResponse, VillageResponse
from app.schemas.market import CompetitorAnalysisResponse, MarketAnalysisResponse
from app.schemas.scheme import SchemeResponse

ConfidenceLevel = Literal["high", "medium", "low", "unverified"]


# -------------------------------------------------------------
# AnalysisContext (input)
# -------------------------------------------------------------


class LocationContext(BaseModel):
    village: VillageResponse
    district: DistrictResponse
    taluka: TalukaResponse


class BusinessContext(BaseModel):
    category: BusinessCategoryResponse
    model: BusinessModelResponse | None = None


class MarketContext(MarketAnalysisResponse):
    """AI input snapshot of the verified market analysis output."""

    id: UUID | None = None
    analysis_run_id: UUID | None = None
    created_at: datetime | None = None

    @model_validator(mode="before")
    @classmethod
    def _normalize_market_keys(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "population_estimate" not in data and "total_population_reach" in data:
                data["population_estimate"] = data.get("total_population_reach")
            elif "population_estimate" not in data and "estimated_population_reach" in data:
                data["population_estimate"] = data.get("estimated_population_reach")

            if "household_estimate" not in data and "household_reach" in data:
                data["household_estimate"] = data.get("household_reach")
            elif "household_estimate" not in data and "estimated_household_reach" in data:
                data["household_estimate"] = data.get("estimated_household_reach")

            if "market_reach_estimate" not in data and "estimated_target_customers" in data:
                data["market_reach_estimate"] = data.get("estimated_target_customers")
        return data

    @property
    def total_population_reach(self) -> int | None:
        return self.population_estimate

    @property
    def household_reach(self) -> int | None:
        return self.household_estimate

    @property
    def estimated_target_customers(self) -> int | None:
        return self.market_reach_estimate

    model_config = {"from_attributes": True}


class CompetitionContext(CompetitorAnalysisResponse):
    """AI input snapshot of the verified competitor analysis output."""

    id: UUID | None = None
    analysis_run_id: UUID | None = None
    created_at: datetime | None = None
    total_businesses_in_radius: int | None = None
    target_category: str | None = None

    @model_validator(mode="before")
    @classmethod
    def _normalize_competition_keys(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "competitor_count" not in data and "total_competitors_count" in data:
                data["competitor_count"] = data.get("total_competitors_count")
        return data

    @property
    def total_competitors_count(self) -> int | None:
        return self.competitor_count

    model_config = {"from_attributes": True}


class SchemeRuleSummary(BaseModel):
    """Subset of a scheme rule relevant to AI advice generation."""

    min_project_cost: float | None = None
    max_project_cost: float | None = None
    beneficiary_contribution_percent: float | None = None
    loan_percent: float | None = None
    max_loan_amount: float | None = None
    interest_rate: float | None = None
    tenure_months: int | None = None
    moratorium_months: int | None = None


class SchemeMatchContext(BaseModel):
    scheme: SchemeResponse
    rule: SchemeRuleSummary | None = None
    match_status: SchemeMatchStatus
    match_score: float | None = None
    matched_conditions: dict[str, Any] | None = None
    failed_conditions: dict[str, Any] | None = None
    missing_information: dict[str, Any] | None = None
    estimated_loan_amount: float | None = None
    estimated_project_cost: float | None = None
    verification_required: bool = True


class FeasibilityContext(FeasibilityAnalysisResponse):
    """AI input snapshot of the verified feasibility analysis output."""

    id: UUID | None = None
    analysis_run_id: UUID | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class RiskContext(BaseModel):
    """Structured risk metric snapshot for the AI context."""

    risk_type: str = Field(..., description="Category or identifier of risk")
    score: float | None = Field(default=None, ge=0.0, le=1.0)
    level: str | None = Field(default=None, description="Risk level (low, medium, high)")
    details: str | None = Field(default=None)


class AnalysisContext(BaseModel):
    location: LocationContext
    business: BusinessContext
    financial: FinanceCalculateResponse
    market: MarketContext
    competition: CompetitionContext
    schemes: list[SchemeMatchContext] = Field(default_factory=list)
    feasibility: FeasibilityContext
    risks: list[RiskContext] = Field(default_factory=list)
    language: str = "en"


# ---------------------------------------------------------------------------
# AIAdvice (output)
# ---------------------------------------------------------------------------


class SourceReference(BaseModel):
    claim: str
    source_type: Literal["document", "scheme_rule", "data_source"]
    reference_id: UUID | str


class AIAdvice(BaseModel):
    summary: str
    recommendation: str
    reasoning: list[str] = Field(default_factory=list)
    financial_advice: list[str] = Field(default_factory=list)
    market_advice: list[str] = Field(default_factory=list)
    competition_advice: list[str] = Field(default_factory=list)
    scheme_advice: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    next_steps: list[str] = Field(default_factory=list)
    disclaimers: list[str] = Field(default_factory=list)
    sources: list[SourceReference] = Field(default_factory=list)
    confidence: ConfidenceLevel
    model_name: str
    prompt_version: str
    language: str = "en"
