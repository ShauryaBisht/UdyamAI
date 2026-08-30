from typing import Optional, List, Dict, Any, TYPE_CHECKING
from datetime import datetime
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON

if TYPE_CHECKING:
    from app.models.user import Profile
    from app.models.location import Village
    from app.models.business import BusinessCategory
    from app.models.finance import FinancialAnalysis
    from app.models.market import MarketAnalysis, CompetitorAnalysis
    from app.models.scheme import SchemeMatch
    from app.models.report import Report
    from app.models.ai import Conversation

class AnalysisRun(SQLModel, table=True):
    __tablename__ = "analysis_runs"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="profiles.id", nullable=False)
    location_id: Optional[UUID] = Field(default=None, foreign_key="villages.id", nullable=True)
    business_category_id: Optional[UUID] = Field(default=None, foreign_key="business_categories.id", nullable=True)
    available_capital: Optional[float] = Field(default=None)
    status: str = Field(default="pending", nullable=False) # pending, running, completed, failed

    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = Field(default=None)

    # Relationships
    profile: "Profile" = Relationship(back_populates="analysis_runs")
    location: Optional["Village"] = Relationship(back_populates="analysis_runs")
    business_category: Optional["BusinessCategory"] = Relationship(back_populates="analysis_runs")

    financial_analyses: List["FinancialAnalysis"] = Relationship(back_populates="analysis_run")
    market_analyses: List["MarketAnalysis"] = Relationship(back_populates="analysis_run")
    competitor_analyses: List["CompetitorAnalysis"] = Relationship(back_populates="analysis_run")
    scheme_matches: List["SchemeMatch"] = Relationship(back_populates="analysis_run")
    feasibility_analyses: List["FeasibilityAnalysis"] = Relationship(back_populates="analysis_run")
    ai_analyses: List["AIAnalysis"] = Relationship(back_populates="analysis_run")
    reports: List["Report"] = Relationship(back_populates="analysis_run")
    conversations: List["Conversation"] = Relationship(back_populates="analysis_run")


class FeasibilityAnalysis(SQLModel, table=True):
    __tablename__ = "feasibility_analyses"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    analysis_run_id: UUID = Field(foreign_key="analysis_runs.id", nullable=False)

    market_score: Optional[float] = Field(default=None)
    financial_score: Optional[float] = Field(default=None)
    competition_score: Optional[float] = Field(default=None)
    infrastructure_score: Optional[float] = Field(default=None)
    risk_score: Optional[float] = Field(default=None)
    overall_score: Optional[float] = Field(default=None)

    recommendation: Optional[str] = Field(default=None)

    # SWOT and Risks (JSON)
    strengths: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    weaknesses: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    opportunities: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    threats: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    risks: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    warnings: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))

    confidence: Optional[str] = Field(default=None)
    scoring_version: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    analysis_run: AnalysisRun = Relationship(back_populates="feasibility_analyses")


class AIAnalysis(SQLModel, table=True):
    __tablename__ = "ai_analyses"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    analysis_run_id: UUID = Field(foreign_key="analysis_runs.id", nullable=False)

    summary: Optional[str] = Field(default=None)
    recommendation: Optional[str] = Field(default=None)

    # AI SWOT and reports (JSON)
    swot: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    opportunities: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    threats: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    risks: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    pricing_strategy: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    business_plan: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))

    model_name: Optional[str] = Field(default=None)
    prompt_version: Optional[str] = Field(default=None)
    confidence: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    analysis_run: AnalysisRun = Relationship(back_populates="ai_analyses")
