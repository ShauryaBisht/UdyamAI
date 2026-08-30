"""
Unit tests for UdyamAI Phase 5 Finance Engine logic & services.
"""

from uuid import uuid4

import pytest
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.models.analysis import AnalysisRun
from app.models.finance import FinancialAnalysis, FinancialScenario, RepaymentSchedule
from app.models.scheme import Scheme, SchemeRule
from app.models.user import Profile
from app.schemas.finance import FinanceCalculateRequest, SchemeRuleInput
from app.services.finance_service import FinanceService


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    tables = [
        Profile.__table__,
        AnalysisRun.__table__,
        Scheme.__table__,
        SchemeRule.__table__,
        FinancialAnalysis.__table__,
        RepaymentSchedule.__table__,
        FinancialScenario.__table__,
    ]
    SQLModel.metadata.create_all(engine, tables=tables)
    with Session(engine) as session:
        yield session


def test_finance_engine_prompt_example():
    """
    Test exact prompt example:
    Available capital = ₹1,00,000
    Required contribution = 10%
    Raw project cost = ₹1,00,000 / 0.10 = ₹10,00,000
    Raw loan = ₹10,00,000 × 0.90 = ₹9,00,000
    """
    rule = SchemeRuleInput(
        beneficiary_contribution_percent=10.0,
        loan_percent=90.0,
        interest_rate=8.5,
        tenure_months=84,
        moratorium_months=6,
    )
    req = FinanceCalculateRequest(
        available_capital=100000.0,
        scheme_rule_override=rule,
    )
    res = FinanceService.calculate_finance(req)

    assert res.status == "success"
    assert res.available_capital == 100000.0
    assert res.feasible_project_cost == 1000000.0
    assert res.potential_loan == 900000.0
    assert res.required_contribution == 100000.0
    assert res.shortfall == 0.0
    assert len(res.repayment_schedule) == 84
    # First 6 months are moratorium
    assert all(item.is_moratorium for item in res.repayment_schedule[:6])
    assert all(not item.is_moratorium for item in res.repayment_schedule[6:])


def test_finance_engine_shortfall_prompt_example():
    """
    Test exact prompt shortfall example:
    Available capital = 50,000
    Desired project cost = 10,00,000 (Required contribution = 1,00,000)
    Expected status = 'insufficient_margin', shortfall = 50,000
    """
    rule = SchemeRuleInput(
        beneficiary_contribution_percent=10.0,
        loan_percent=90.0,
        interest_rate=8.0,
        tenure_months=60,
    )
    req = FinanceCalculateRequest(
        available_capital=50000.0,
        desired_project_cost=1000000.0,
        scheme_rule_override=rule,
    )
    res = FinanceService.calculate_finance(req)

    assert res.status == "insufficient_margin"
    assert res.available_capital == 50000.0
    assert res.required_contribution == 100000.0
    assert res.shortfall == 50000.0


def test_finance_engine_database_rule_and_persistence(session: Session):
    """Test fetching SchemeRule from DB and persisting FinancialAnalysis results."""
    # Setup test DB profile & analysis run
    profile = Profile(auth_user_id=uuid4(), name="Test Entrepreneur")

    session.add(profile)
    session.commit()

    run = AnalysisRun(user_id=profile.id, available_capital=150000.0)
    session.add(run)
    session.commit()

    # Create Scheme & SchemeRule in DB
    scheme = Scheme(name="PMEGP Micro Scheme", active=True)
    session.add(scheme)
    session.commit()

    rule = SchemeRule(
        scheme_id=scheme.id,
        beneficiary_contribution_percent=15.0,
        loan_percent=85.0,
        min_project_cost=50000.0,
        max_project_cost=1000000.0,
        max_loan_amount=800000.0,
        interest_rate=9.5,
        tenure_months=60,
        moratorium_months=3,
    )
    session.add(rule)
    session.commit()

    req = FinanceCalculateRequest(
        available_capital=150000.0,
        scheme_id=scheme.id,
        analysis_run_id=run.id,
        monthly_revenue=80000.0,
        monthly_operating_cost=45000.0,
    )
    res = FinanceService.calculate_finance(req, session=session)

    assert res.status == "success"
    assert res.beneficiary_contribution_percent == 15.0
    assert res.loan_percent == 85.0
    assert res.feasible_project_cost == 1000000.0  # ₹150,000 / 0.15 = 10 Lakh
    assert res.potential_loan == 800000.0  # Capped at 8 Lakh max loan
    assert res.loan_cap_applied is True

    # Verify DB persistence
    db_analysis = session.query(FinancialAnalysis).filter_by(analysis_run_id=run.id).first()
    assert db_analysis is not None
    assert db_analysis.calculated_loan == 800000.0
    assert db_analysis.interest_rate == 9.5

    schedules = (
        session.query(RepaymentSchedule).filter_by(financial_analysis_id=db_analysis.id).all()
    )
    assert len(schedules) == 60

    scenarios = (
        session.query(FinancialScenario).filter_by(financial_analysis_id=db_analysis.id).all()
    )
    assert len(scenarios) == 3


def test_finance_engine_database_error_handling(monkeypatch):
    """Test that a database exception returns a graceful database_error response."""

    class BrokenSession:
        def exec(self, statement):
            raise RuntimeError("Database connection lost")

    req = FinanceCalculateRequest(
        available_capital=100000.0,
        scheme_id=uuid4(),
    )
    res = FinanceService.calculate_finance(req, session=BrokenSession())
    assert res.status == "database_error"
    assert "database error" in res.message.lower()
