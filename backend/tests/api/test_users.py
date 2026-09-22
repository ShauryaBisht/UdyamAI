"""Tests for User account routes (/users/me)."""

from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import Depends
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.api.deps import get_current_profile, get_current_user
from app.config import settings
from app.database import get_session
from app.main import app
from app.models.ai import Conversation, Message
from app.models.analysis import AIAnalysis, AnalysisRun, FeasibilityAnalysis
from app.models.budget import Budget, BudgetItem
from app.models.cash_flow import CashFlowEntry, CashFlowSummary
from app.models.credit import Borrowing, CreditScore
from app.models.debt import Debt, DebtPayment
from app.models.expenses import Expense
from app.models.finance import FinancialAnalysis, FinancialScenario, RepaymentSchedule
from app.models.market import CompetitorAnalysis, MarketAnalysis
from app.models.report import Report
from app.models.savings import SavingsGoal, SavingsTransaction
from app.models.scheme import Scheme, SchemeMatch
from app.models.system import PrivacyConsent, RecycleBinItem, UserSettings
from app.models.user import Profile
from app.services.auth_service import AuthUser


@pytest.fixture
def test_user_and_profile(test_engine):
    """Setup a dedicated persisted user and profile in the test database session."""
    auth_user_id = uuid4()
    profile_id = uuid4()

    auth_user = AuthUser(
        sub=str(auth_user_id),
        email="entrepreneur@udyamai.org",
        phone="+919876543210",
        role="authenticated",
    )
    profile = Profile(
        id=profile_id,
        auth_user_id=auth_user_id,
        name="Ramesh Patil",
        email="entrepreneur@udyamai.org",
        phone="+919876543210",
        business_name="Patil Agro Services",
        business_type="agriculture",
        preferred_language="mr",
    )

    with Session(test_engine, expire_on_commit=False) as session:
        session.add(profile)
        session.commit()

    def _get_test_session():
        with Session(test_engine) as session:
            yield session

    def _get_test_profile(session: Session = Depends(get_session)) -> Profile:
        p = session.exec(select(Profile).where(Profile.auth_user_id == auth_user_id)).first()
        if not p:
            p = Profile(
                id=profile_id,
                auth_user_id=auth_user_id,
                name="Ramesh Patil",
                email="entrepreneur@udyamai.org",
                phone="+919876543210",
                business_name="Patil Agro Services",
                business_type="agriculture",
                preferred_language="mr",
            )
            session.add(p)
            session.commit()
            session.refresh(p)
        return p

    # Override dependencies for this test
    app.dependency_overrides[get_session] = _get_test_session
    app.dependency_overrides[get_current_user] = lambda: auth_user
    app.dependency_overrides[get_current_profile] = _get_test_profile

    yield auth_user, profile

    app.dependency_overrides.clear()


def test_users_me_unauthenticated(client: TestClient):
    """Unauthenticated call to /api/v1/users/me should be rejected with 401."""
    app.dependency_overrides.clear()
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401


def test_get_users_me_authenticated(client: TestClient, test_user_and_profile):
    """GET /users/me and /api/v1/users/me return profile and initialized settings."""
    _, profile = test_user_and_profile

    response = client.get("/api/v1/users/me")
    assert response.status_code == 200
    data = response.json()

    assert data["id"] == str(profile.id)
    assert data["name"] == "Ramesh Patil"
    assert data["email"] == "entrepreneur@udyamai.org"
    assert data["business_name"] == "Patil Agro Services"
    assert data["business_type"] == "agriculture"
    assert data["preferred_language"] == "mr"
    assert "settings" in data
    assert data["settings"]["currency"] == "INR"


def test_patch_users_me(client: TestClient, test_user_and_profile):
    """PATCH /users/me updates both profile fields and settings fields."""
    _, profile = test_user_and_profile

    update_payload = {
        "name": "Ramesh S. Patil",
        "business_name": "Patil Smart Agro",
        "business_type": "food_processing",
        "preferred_language": "hi",
        "theme": "dark",
        "notification_email": False,
        "notification_sms": True,
        "default_view": "cashflow",
    }

    response = client.patch("/api/v1/users/me", json=update_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["name"] == "Ramesh S. Patil"
    assert data["business_name"] == "Patil Smart Agro"
    assert data["business_type"] == "food_processing"
    assert data["preferred_language"] == "hi"

    settings_data = data["settings"]
    assert settings_data["theme"] == "dark"
    assert settings_data["notification_email"] is False
    assert settings_data["notification_sms"] is True
    assert settings_data["default_view"] == "cashflow"


def test_patch_users_me_nested_settings(client: TestClient, test_user_and_profile):
    """PATCH /users/me supports nested settings dictionary with validation."""
    _, profile = test_user_and_profile

    update_payload = {
        "settings": {
            "theme": "dark",
            "currency": "INR",
            "default_view": "dashboard",
            "notification_push": False,
        }
    }

    response = client.patch("/api/v1/users/me", json=update_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["settings"]["theme"] == "dark"
    assert data["settings"]["notification_push"] is False


def test_delete_users_me_comprehensive(client: TestClient, test_user_and_profile, test_engine):
    """DELETE /users/me deletes profile and all foreign-key-dependent child records without integrity errors."""
    _, profile = test_user_and_profile
    profile_id = profile.id

    # Pre-generate UUIDs for seeded records
    goal_id = uuid4()
    budget_id = uuid4()
    debt_id = uuid4()
    run_id = uuid4()
    conv_id = uuid4()
    fa_id = uuid4()
    msg_id = uuid4()
    report_id = uuid4()
    feasibility_id = uuid4()
    ai_id = uuid4()
    market_id = uuid4()
    comp_id = uuid4()
    match_id = uuid4()
    schedule_id = uuid4()
    scenario_id = uuid4()
    debt_pmt_id = uuid4()
    budget_item_id = uuid4()
    savings_tx_id = uuid4()
    settings_id = uuid4()
    consent_id = uuid4()
    bin_id = uuid4()
    expense_id = uuid4()
    cashflow_entry_id = uuid4()
    cashflow_summary_id = uuid4()
    borrowing_id = uuid4()
    credit_id = uuid4()

    # Seed all child tables referencing profile and analysis runs
    with Session(test_engine) as session:
        # 1. System records
        settings_rec = UserSettings(id=settings_id, profile_id=profile_id)
        consent_rec = PrivacyConsent(
            id=consent_id, profile_id=profile_id, consent_type="data_sharing", granted=True
        )
        bin_rec = RecycleBinItem(
            id=bin_id, profile_id=profile_id, item_type="expense", item_id=uuid4(), item_data="{}"
        )
        session.add_all([settings_rec, consent_rec, bin_rec])

        # 2. Financial records
        expense_rec = Expense(id=expense_id, profile_id=profile_id, category="rent", amount=5000.0)
        cashflow_entry = CashFlowEntry(
            id=cashflow_entry_id,
            profile_id=profile_id,
            entry_type="income",
            category="sales",
            amount=15000.0,
        )
        cashflow_summary = CashFlowSummary(
            id=cashflow_summary_id,
            profile_id=profile_id,
            period_start=profile.created_at,
            period_end=profile.created_at,
            total_income=15000.0,
        )
        savings_goal = SavingsGoal(
            id=goal_id, profile_id=profile_id, name="Equipment", target_amount=50000.0
        )
        budget_rec = Budget(
            id=budget_id,
            profile_id=profile_id,
            name="Monthly Budget",
            start_date=profile.created_at,
            end_date=profile.created_at,
        )
        debt_rec = Debt(
            id=debt_id,
            profile_id=profile_id,
            lender_name="Bank of India",
            loan_type="term_loan",
            principal_amount=100000.0,
            outstanding_amount=90000.0,
            interest_rate=8.5,
        )
        borrowing_rec = Borrowing(
            id=borrowing_id,
            profile_id=profile_id,
            lender_name="SBI",
            loan_type="mudra",
            requested_amount=50000.0,
        )
        credit_rec = CreditScore(id=credit_id, profile_id=profile_id, score=750)
        session.add_all(
            [
                expense_rec,
                cashflow_entry,
                cashflow_summary,
                savings_goal,
                budget_rec,
                debt_rec,
                borrowing_rec,
                credit_rec,
            ]
        )
        session.commit()

        # 3. Second-tier financial children
        debt_pmt = DebtPayment(id=debt_pmt_id, debt_id=debt_id, amount=5000.0)
        budget_item = BudgetItem(
            id=budget_item_id,
            budget_id=budget_id,
            category="rent",
            item_type="expense",
            planned_amount=5000.0,
        )
        savings_tx = SavingsTransaction(
            id=savings_tx_id, goal_id=goal_id, amount=2000.0, transaction_type="deposit"
        )
        session.add_all([debt_pmt, budget_item, savings_tx])

        # 4. Analysis and AI children
        run_rec = AnalysisRun(id=run_id, user_id=profile_id, status="completed")
        conv_rec = Conversation(id=conv_id, user_id=profile_id, language="en")
        session.add_all([run_rec, conv_rec])
        session.commit()

        msg_rec = Message(id=msg_id, conversation_id=conv_id, role="user", content="Hello AI")
        report_rec = Report(
            id=report_id, user_id=profile_id, analysis_run_id=run_id, title="Report"
        )
        feasibility_rec = FeasibilityAnalysis(
            id=feasibility_id, analysis_run_id=run_id, overall_score=85.0
        )
        ai_rec = AIAnalysis(id=ai_id, analysis_run_id=run_id, summary="Summary")
        market_rec = MarketAnalysis(id=market_id, analysis_run_id=run_id, radius_km=10.0)
        comp_rec = CompetitorAnalysis(id=comp_id, analysis_run_id=run_id, competitor_count=5)

        scheme_rec = Scheme(name="PMEGP Test Scheme", code="PMEGP_TEST", active=True)
        session.add(scheme_rec)
        session.commit()

        scheme_match = SchemeMatch(
            id=match_id, analysis_run_id=run_id, scheme_id=scheme_rec.id, match_status="eligible"
        )
        fa_rec = FinancialAnalysis(id=fa_id, analysis_run_id=run_id, calculated_loan=50000.0)
        session.add_all(
            [
                msg_rec,
                report_rec,
                feasibility_rec,
                ai_rec,
                market_rec,
                comp_rec,
                scheme_match,
                fa_rec,
            ]
        )
        session.commit()

        schedule_rec = RepaymentSchedule(
            id=schedule_id,
            financial_analysis_id=fa_id,
            period_number=1,
            payment_amount=1000.0,
            principal_amount=800.0,
            interest_amount=200.0,
            remaining_principal=49200.0,
        )
        scenario_rec = FinancialScenario(
            id=scenario_id,
            financial_analysis_id=fa_id,
            scenario_type="best_case",
            monthly_revenue=20000.0,
            monthly_profit=5000.0,
        )
        session.add_all([schedule_rec, scenario_rec])
        session.commit()

    # Perform DELETE request
    response = client.delete("/api/v1/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "deleted successfully" in data["message"]

    # Verify that all records across all tables were removed
    with Session(test_engine) as session:
        assert session.exec(select(Profile).where(Profile.id == profile_id)).first() is None
        assert (
            session.exec(select(UserSettings).where(UserSettings.id == settings_id)).first() is None
        )
        assert session.exec(select(Expense).where(Expense.id == expense_id)).first() is None
        assert (
            session.exec(select(CashFlowEntry).where(CashFlowEntry.id == cashflow_entry_id)).first()
            is None
        )
        assert (
            session.exec(
                select(CashFlowSummary).where(CashFlowSummary.id == cashflow_summary_id)
            ).first()
            is None
        )
        assert session.exec(select(SavingsGoal).where(SavingsGoal.id == goal_id)).first() is None
        assert (
            session.exec(
                select(SavingsTransaction).where(SavingsTransaction.id == savings_tx_id)
            ).first()
            is None
        )
        assert session.exec(select(Budget).where(Budget.id == budget_id)).first() is None
        assert (
            session.exec(select(BudgetItem).where(BudgetItem.id == budget_item_id)).first() is None
        )
        assert session.exec(select(Debt).where(Debt.id == debt_id)).first() is None
        assert (
            session.exec(select(DebtPayment).where(DebtPayment.id == debt_pmt_id)).first() is None
        )
        assert session.exec(select(Borrowing).where(Borrowing.id == borrowing_id)).first() is None
        assert session.exec(select(CreditScore).where(CreditScore.id == credit_id)).first() is None
        assert session.exec(select(AnalysisRun).where(AnalysisRun.id == run_id)).first() is None
        assert (
            session.exec(select(FinancialAnalysis).where(FinancialAnalysis.id == fa_id)).first()
            is None
        )
        assert (
            session.exec(
                select(RepaymentSchedule).where(RepaymentSchedule.id == schedule_id)
            ).first()
            is None
        )
        assert (
            session.exec(
                select(FinancialScenario).where(FinancialScenario.id == scenario_id)
            ).first()
            is None
        )
        assert (
            session.exec(select(MarketAnalysis).where(MarketAnalysis.id == market_id)).first()
            is None
        )
        assert (
            session.exec(select(CompetitorAnalysis).where(CompetitorAnalysis.id == comp_id)).first()
            is None
        )
        assert session.exec(select(SchemeMatch).where(SchemeMatch.id == match_id)).first() is None
        assert (
            session.exec(
                select(FeasibilityAnalysis).where(FeasibilityAnalysis.id == feasibility_id)
            ).first()
            is None
        )
        assert session.exec(select(AIAnalysis).where(AIAnalysis.id == ai_id)).first() is None
        assert session.exec(select(Report).where(Report.id == report_id)).first() is None
        assert session.exec(select(Conversation).where(Conversation.id == conv_id)).first() is None
        assert session.exec(select(Message).where(Message.id == msg_id)).first() is None
        assert (
            session.exec(select(PrivacyConsent).where(PrivacyConsent.id == consent_id)).first()
            is None
        )
        assert (
            session.exec(select(RecycleBinItem).where(RecycleBinItem.id == bin_id)).first() is None
        )


def test_delete_users_me_supabase_admin_error(client: TestClient, test_user_and_profile):
    """DELETE /users/me returns 502 Bad Gateway if Supabase Admin deletion fails."""
    with (
        patch.object(settings, "SUPABASE_URL", "https://xyz.supabase.co"),
        patch.object(settings, "SUPABASE_SERVICE_ROLE_KEY", "mock-service-key"),
    ):
        mock_response = MagicMock()
        mock_response.status = 500
        with patch("urllib.request.urlopen", return_value=mock_response):
            response = client.delete("/api/v1/users/me")
            assert response.status_code == 502
            assert "Failed to delete auth user from Supabase Admin" in response.json()["detail"]
