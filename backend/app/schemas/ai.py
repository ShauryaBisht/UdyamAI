"""Pydantic contracts for the AI Advisor layer.

AnalysisContext = verified input from Backend 1's analysis pipeline.
AIAdvice = structured output returned to the frontend.

See docs/ai-contract.md for the full field-by-field rationale — this file
is the enforced version of that doc; keep them in sync.

NOTE: MarketContext, CompetitionContext, FeasibilityContext, and
SchemeRuleSummary below are defined inline because backend/app/schemas/
market.py and the feasibility scores/SWOT response schema don't exist yet
(see contract doc, "Open items"). Once those land, replace these inline
definitions with imports from the real schema files instead of keeping two
copies of the same shape.
"""

from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.business import BusinessCategoryResponse, BusinessModelResponse
from app.schemas.finance import FinanceCalculateResponse
from app.schemas.location import DistrictResponse, TalukaResponse, VillageResponse
from app.schemas.scheme import SchemeResponse

ConfidenceLevel = Literal["high", "medium", "low", "unverified"]


# ---------------------------------------------------------------------------
# AnalysisContext (input)
# ---------------------------------------------------------------------------


class LocationContext(BaseModel):
    village: VillageResponse
    district: DistrictResponse
    taluka: TalukaResponse


class BusinessContext(BaseModel):
    category: BusinessCategoryResponse
    model: BusinessModelResponse | None = None


class MarketContext(BaseModel):
    """Inline pending schemas/market.py — see module docstring."""

    radius_km: float | None = None
    population_estimate: int | None = None
    household_estimate: int | None = None
    market_reach_estimate: int | None = None
    competitor_count: int | None = None
    demand_indicators: dict[str, Any] | None = None
    distribution_channels: dict[str, Any] | None = None
    pricing_indicators: dict[str, Any] | None = None
    market_gaps: dict[str, Any] | None = None
    data_confidence: ConfidenceLevel | None = None


class CompetitionContext(BaseModel):
    radius_km: float | None = None
    competitor_count: int | None = None
    competition_density: float | None = None
    competitor_distribution: dict[str, Any] | None = None
    identified_gaps: dict[str, Any] | None = None
    data_confidence: ConfidenceLevel | None = None


class SchemeRuleSummary(BaseModel):
    """Subset of SchemeRule relevant to advice generation."""

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
    match_status: Literal["potential_match", "not_matched", "insufficient_information"]
    match_score: float | None = None
    matched_conditions: dict[str, Any] | None = None
    failed_conditions: dict[str, Any] | None = None
    missing_information: dict[str, Any] | None = None
    estimated_loan_amount: float | None = None
    estimated_project_cost: float | None = None
    verification_required: bool = True


class FeasibilityContext(BaseModel):
    """Inline pending schemas/feasibility.py scores/SWOT response — see module docstring."""

    market_score: float | None = None
    financial_score: float | None = None
    competition_score: float | None = None
    infrastructure_score: float | None = None
    risk_score: float | None = None
    overall_score: float | None = None
    recommendation: str | None = None
    strengths: dict[str, Any] | None = None
    weaknesses: dict[str, Any] | None = None
    opportunities: dict[str, Any] | None = None
    threats: dict[str, Any] | None = None
    risks: dict[str, Any] | None = None
    warnings: dict[str, Any] | None = None
    confidence: ConfidenceLevel | None = None
    scoring_version: str | None = None


class AnalysisContext(BaseModel):
    location: LocationContext
    business: BusinessContext
    financial: FinanceCalculateResponse
    market: MarketContext
    competition: CompetitionContext
    schemes: list[SchemeMatchContext] = Field(default_factory=list)
    feasibility: FeasibilityContext
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