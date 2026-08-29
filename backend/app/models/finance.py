from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON

class FinancialAnalysis(SQLModel, table=True):
    __tablename__ = "financial_analyses"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    analysis_run_id: UUID = Field(foreign_key="analysis_runs.id", nullable=False)
    scheme_id: Optional[UUID] = Field(default=None, foreign_key="schemes.id", nullable=True)

    available_capital: Optional[float] = Field(default=None)
    required_contribution: Optional[float] = Field(default=None)
    desired_project_cost: Optional[float] = Field(default=None)
    feasible_project_cost: Optional[float] = Field(default=None)

    margin_gap: Optional[float] = Field(default=None)
    calculated_loan: Optional[float] = Field(default=None)
    interest_rate: Optional[float] = Field(default=None)
    tenure_months: Optional[int] = Field(default=None)
    moratorium_months: Optional[int] = Field(default=None)

    monthly_emi: Optional[float] = Field(default=None)
    total_interest: Optional[float] = Field(default=None)
    total_repayment: Optional[float] = Field(default=None)

    working_capital: Optional[float] = Field(default=None)
    monthly_revenue: Optional[float] = Field(default=None)
    monthly_operating_cost: Optional[float] = Field(default=None)
    monthly_profit: Optional[float] = Field(default=None)

    break_even_months: Optional[float] = Field(default=None)
    repayment_capacity: Optional[float] = Field(default=None)
    calculation_version: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    analysis_run: "AnalysisRun" = Relationship(back_populates="financial_analyses")
    scheme: Optional["Scheme"] = Relationship(back_populates="financial_analyses")
    repayment_schedules: List["RepaymentSchedule"] = Relationship(back_populates="financial_analysis")
    financial_scenarios: List["FinancialScenario"] = Relationship(back_populates="financial_analysis")


class RepaymentSchedule(SQLModel, table=True):
    __tablename__ = "repayment_schedules"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    financial_analysis_id: UUID = Field(foreign_key="financial_analyses.id", nullable=False)

    period_number: int = Field(nullable=False)
    period_start: Optional[date] = Field(default=None)
    period_end: Optional[date] = Field(default=None)

    principal_amount: Optional[float] = Field(default=None)
    interest_amount: Optional[float] = Field(default=None)
    payment_amount: Optional[float] = Field(default=None)
    remaining_principal: Optional[float] = Field(default=None)
    is_moratorium: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    financial_analysis: FinancialAnalysis = Relationship(back_populates="repayment_schedules")


class FinancialScenario(SQLModel, table=True):
    __tablename__ = "financial_scenarios"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    financial_analysis_id: UUID = Field(foreign_key="financial_analyses.id", nullable=False)
    scenario_type: str = Field(nullable=False) # worst_case, expected_case, best_case

    monthly_revenue: Optional[float] = Field(default=None)
    monthly_expenses: Optional[float] = Field(default=None)
    monthly_profit: Optional[float] = Field(default=None)
    cash_flow: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    repayment_coverage: Optional[float] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    financial_analysis: FinancialAnalysis = Relationship(back_populates="financial_scenarios")
