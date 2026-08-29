from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON

class Scheme(SQLModel, table=True):
    __tablename__ = "schemes"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(nullable=False)
    description: Optional[str] = Field(default=None)
    agency_name: Optional[str] = Field(default=None)
    state: Optional[str] = Field(default=None)
    active: bool = Field(default=True)
    official_url: Optional[str] = Field(default=None)
    source: Optional[str] = Field(default=None)
    last_verified_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    rules: List["SchemeRule"] = Relationship(back_populates="scheme")
    eligibility_rules: List["SchemeEligibilityRule"] = Relationship(back_populates="scheme")
    matches: List["SchemeMatch"] = Relationship(back_populates="scheme")
    financial_analyses: List["FinancialAnalysis"] = Relationship(back_populates="scheme")
    document_chunks: List["DocumentChunk"] = Relationship(back_populates="scheme")


class SchemeRule(SQLModel, table=True):
    __tablename__ = "scheme_rules"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    scheme_id: UUID = Field(foreign_key="schemes.id", nullable=False)

    min_project_cost: Optional[float] = Field(default=None)
    max_project_cost: Optional[float] = Field(default=None)
    beneficiary_contribution_percent: Optional[float] = Field(default=None)
    loan_percent: Optional[float] = Field(default=None)
    max_loan_amount: Optional[float] = Field(default=None)

    interest_rate: Optional[float] = Field(default=None)
    tenure_months: Optional[int] = Field(default=None)
    moratorium_months: Optional[int] = Field(default=None)

    min_age: Optional[int] = Field(default=None)
    max_age: Optional[int] = Field(default=None)
    income_limit: Optional[float] = Field(default=None)

    # JSON conditions
    eligible_business_categories: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    eligible_locations: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    eligible_beneficiary_categories: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    other_conditions: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))

    effective_from: Optional[date] = Field(default=None)
    effective_until: Optional[date] = Field(default=None)
    source_document_id: Optional[UUID] = Field(default=None, foreign_key="documents.id", nullable=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    scheme: Scheme = Relationship(back_populates="rules")
    source_document: Optional["Document"] = Relationship(back_populates="scheme_rules")


class SchemeEligibilityRule(SQLModel, table=True):
    __tablename__ = "scheme_eligibility_rules"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    scheme_id: UUID = Field(foreign_key="schemes.id", nullable=False)
    rule_type: Optional[str] = Field(default=None)
    field_name: Optional[str] = Field(default=None)
    operator: Optional[str] = Field(default=None)
    expected_value: Optional[Any] = Field(default=None, sa_column=Column(JSON))
    description: Optional[str] = Field(default=None)
    source_document_id: Optional[UUID] = Field(default=None, foreign_key="documents.id", nullable=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    scheme: Scheme = Relationship(back_populates="eligibility_rules")
    source_document: Optional["Document"] = Relationship(back_populates="scheme_eligibility_rules")


class SchemeMatch(SQLModel, table=True):
    __tablename__ = "scheme_matches"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    analysis_run_id: UUID = Field(foreign_key="analysis_runs.id", nullable=False)
    scheme_id: UUID = Field(foreign_key="schemes.id", nullable=False)

    match_status: str = Field(nullable=False) # potential_match, not_matched, insufficient_information
    match_score: Optional[float] = Field(default=None)

    # JSON details
    matched_conditions: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    failed_conditions: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    missing_information: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))

    estimated_loan_amount: Optional[float] = Field(default=None)
    estimated_project_cost: Optional[float] = Field(default=None)
    verification_required: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    scheme: Scheme = Relationship(back_populates="matches")
    analysis_run: "AnalysisRun" = Relationship(back_populates="scheme_matches")
