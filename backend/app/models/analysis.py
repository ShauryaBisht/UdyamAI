from datetime import datetime
from typing import TYPE_CHECKING, Any, Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON, Column
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.ai import Conversation
    from app.models.business import BusinessCategory
    from app.models.finance import FinancialAnalysis
    from app.models.location import Village
    from app.models.market import CompetitorAnalysis, MarketAnalysis
    from app.models.report import Report
    from app.models.scheme import SchemeMatch
    from app.models.user import Profile


class AnalysisRun(SQLModel, table=True):
    __tablename__ = "analysis_runs"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="profiles.id", nullable=False)
    location_id: UUID | None = Field(default=None, foreign_key="villages.id", nullable=True)
    business_category_id: UUID | None = Field(
        default=None, foreign_key="business_categories.id", nullable=True
    )
    available_capital: float | None = Field(default=None)
    status: str = Field(default="pending", nullable=False)  # pending, running, completed, failed

    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = Field(default=None)

    # Relationships
    profile: "Profile" = Relationship(back_populates="analysis_runs")
    location: Optional["Village"] = Relationship(back_populates="analysis_runs")
    business_category: Optional["BusinessCategory"] = Relationship(back_populates="analysis_runs")

    financial_analyses: list["FinancialAnalysis"] = Relationship(back_populates="analysis_run")
    market_analyses: list["MarketAnalysis"] = Relationship(back_populates="analysis_run")
    competitor_analyses: list["CompetitorAnalysis"] = Relationship(back_populates="analysis_run")
    scheme_matches: list["SchemeMatch"] = Relationship(back_populates="analysis_run")
    feasibility_analyses: list["FeasibilityAnalysis"] = Relationship(back_populates="analysis_run")
    ai_analyses: list["AIAnalysis"] = Relationship(back_populates="analysis_run")
    reports: list["Report"] = Relationship(back_populates="analysis_run")
    conversations: list["Conversation"] = Relationship(back_populates="analysis_run")


class FeasibilityAnalysis(SQLModel, table=True):
    __tablename__ = "feasibility_analyses"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    analysis_run_id: UUID = Field(foreign_key="analysis_runs.id", nullable=False)

    market_score: float | None = Field(default=None)
    financial_score: float | None = Field(default=None)
    competition_score: float | None = Field(default=None)
    infrastructure_score: float | None = Field(default=None)
    risk_score: float | None = Field(default=None)
    overall_score: float | None = Field(default=None)

    recommendation: str | None = Field(default=None)

    # SWOT and Risks (JSON)
    strengths: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    weaknesses: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    opportunities: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    threats: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    risks: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    warnings: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))

    confidence: str | None = Field(default=None)
    scoring_version: str | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    analysis_run: AnalysisRun = Relationship(back_populates="feasibility_analyses")


class AIAnalysis(SQLModel, table=True):
    __tablename__ = "ai_analyses"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    analysis_run_id: UUID = Field(foreign_key="analysis_runs.id", nullable=False)

    summary: str | None = Field(default=None)
    recommendation: str | None = Field(default=None)

    # AI SWOT and reports (JSON)
    swot: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    opportunities: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    threats: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    risks: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    pricing_strategy: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    business_plan: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))

    model_name: str | None = Field(default=None)
    prompt_version: str | None = Field(default=None)
    confidence: str | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    analysis_run: AnalysisRun = Relationship(back_populates="ai_analyses")
