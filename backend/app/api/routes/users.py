"""User account and profile management routes."""

import json
import logging
import urllib.request
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, delete, select

from app.api.deps import get_current_profile, get_current_user
from app.config import settings
from app.database import get_session
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
from app.models.scheme import SchemeMatch
from app.models.system import PrivacyConsent, RecycleBinItem, UserSettings
from app.models.user import Profile
from app.schemas.user import (
    UserResponse,
    UserSettingsResponse,
    UserSettingsUpdateRequest,
    UserUpdateRequest,
)
from app.services.auth_service import AuthUser

logger = logging.getLogger(__name__)

router = APIRouter()


def _get_or_create_settings(session: Session, profile_id: UUID) -> UserSettings:
    """Retrieve or create application settings for the user profile."""
    settings_obj = session.exec(
        select(UserSettings).where(UserSettings.profile_id == profile_id)
    ).first()
    if not settings_obj:
        settings_obj = UserSettings(profile_id=profile_id)
        session.add(settings_obj)
        session.commit()
        session.refresh(settings_obj)
    return settings_obj


def _build_user_response(profile: Profile, settings_obj: UserSettings | None) -> UserResponse:
    """Build a consolidated UserResponse containing profile and application settings."""
    settings_resp = UserSettingsResponse.model_validate(settings_obj) if settings_obj else None
    return UserResponse(
        id=profile.id,
        auth_user_id=profile.auth_user_id,
        name=profile.name,
        email=profile.email,
        phone=profile.phone,
        business_name=profile.business_name,
        business_type=profile.business_type,
        preferred_language=profile.preferred_language or "en",
        location_id=profile.location_id,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
        settings=settings_resp,
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    user: AuthUser = Depends(get_current_user),
    profile: Profile = Depends(get_current_profile),
    session: Session = Depends(get_session),
) -> UserResponse:
    """Fetch the authenticated user's profile and settings."""
    settings_obj = _get_or_create_settings(session, profile.id)
    return _build_user_response(profile, settings_obj)


@router.patch("/me", response_model=UserResponse)
def update_current_user_profile(
    data: UserUpdateRequest,
    user: AuthUser = Depends(get_current_user),
    profile: Profile = Depends(get_current_profile),
    session: Session = Depends(get_session),
) -> UserResponse:
    """Update profile and settings fields for the authenticated user.

    Supports fields sent by both profile/page.tsx (name, email, phone,
    business_name, business_type, preferred_language) and settings/page.tsx
    (language, theme, date_format, default_view, notification_email,
    notification_sms, notification_push, auto_backup).
    """
    # 0. If email is being updated, sync with Supabase Auth Admin if configured
    if data.email is not None and data.email != profile.email:
        if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
            try:
                base_url = settings.SUPABASE_URL.rstrip("/")
                url = f"{base_url}/auth/v1/admin/users/{profile.auth_user_id}"
                body = json.dumps({"email": data.email}).encode("utf-8")
                req = urllib.request.Request(
                    url,
                    data=body,
                    headers={
                        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                        "Content-Type": "application/json",
                    },
                    method="PUT",
                )
                with urllib.request.urlopen(req, timeout=5) as resp:
                    if resp.status >= 400:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Failed to update email in Supabase Auth",
                        )
            except HTTPException:
                raise
            except Exception as exc:
                logger.error("Could not update auth user email in Supabase: %s", exc)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to update email in Supabase Auth: {exc}",
                ) from exc

    # 1. Update Profile fields
    profile_fields = [
        "name",
        "email",
        "phone",
        "business_name",
        "business_type",
        "preferred_language",
        "location_id",
    ]
    profile_updated = False
    for field in profile_fields:
        val = getattr(data, field)
        if val is not None:
            setattr(profile, field, val)
            profile_updated = True

    # Keep preferred_language in sync if top-level language was provided
    if data.language is not None and data.preferred_language is None:
        profile.preferred_language = data.language
        profile_updated = True

    if profile_updated:
        profile.updated_at = datetime.now(timezone.utc)
        session.add(profile)

    # 2. Update UserSettings fields
    settings_obj = _get_or_create_settings(session, profile.id)
    settings_fields = [
        "currency",
        "date_format",
        "notification_email",
        "notification_sms",
        "notification_push",
        "language",
        "theme",
        "default_view",
        "auto_backup",
    ]
    settings_updated = False
    for field in settings_fields:
        val = getattr(data, field)
        if val is not None:
            setattr(settings_obj, field, val)
            settings_updated = True

    # Also handle nested settings dict if client sent { settings: { ... } }
    if data.settings:
        if isinstance(data.settings, dict):
            validated_settings = UserSettingsUpdateRequest.model_validate(data.settings)
        else:
            validated_settings = data.settings

        for field in settings_fields:
            nested_val = getattr(validated_settings, field, None)
            if nested_val is not None:
                setattr(settings_obj, field, nested_val)
                settings_updated = True

    # Keep settings.language in sync if preferred_language was set
    if data.preferred_language is not None and data.language is None:
        nested_dict = (
            data.settings
            if isinstance(data.settings, dict)
            else (data.settings.model_dump() if data.settings else None)
        )
        if not nested_dict or "language" not in nested_dict:
            settings_obj.language = data.preferred_language
            settings_updated = True

    if settings_updated:
        settings_obj.updated_at = datetime.now(timezone.utc)
        session.add(settings_obj)

    session.commit()
    session.refresh(profile)
    session.refresh(settings_obj)

    return _build_user_response(profile, settings_obj)


@router.delete("/me", status_code=status.HTTP_200_OK)
def delete_current_user_profile(
    user: AuthUser = Depends(get_current_user),
    profile: Profile = Depends(get_current_profile),
    session: Session = Depends(get_session),
) -> dict[str, Any]:
    """Delete the authenticated user's profile and all associated data."""
    profile_id = profile.id
    auth_user_id = profile.auth_user_id

    # 1. First, delete Supabase Auth Admin user if configured, to ensure auth identity removal
    if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
        try:
            base_url = settings.SUPABASE_URL.rstrip("/")
            url = f"{base_url}/auth/v1/admin/users/{auth_user_id}"
            req = urllib.request.Request(
                url,
                headers={
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                    "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                },
                method="DELETE",
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status >= 400:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"Failed to delete auth user from Supabase Admin (status {resp.status})",
                    )
                logger.info(
                    "Deleted user %s from Supabase Auth (HTTP %s)", auth_user_id, resp.status
                )
        except HTTPException:
            raise
        except Exception as exc:
            logger.error("Could not delete auth user %s from Supabase Admin: %s", auth_user_id, exc)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to delete auth user from Supabase Admin: {exc}",
            ) from exc

    # 2. Collect IDs of parent runs and analyses
    run_ids = session.exec(select(AnalysisRun.id).where(AnalysisRun.user_id == profile_id)).all()
    conv_ids = session.exec(select(Conversation.id).where(Conversation.user_id == profile_id)).all()
    debt_ids = session.exec(select(Debt.id).where(Debt.profile_id == profile_id)).all()
    budget_ids = session.exec(select(Budget.id).where(Budget.profile_id == profile_id)).all()
    goal_ids = session.exec(
        select(SavingsGoal.id).where(SavingsGoal.profile_id == profile_id)
    ).all()

    # 3. Delete grand-children and children of AnalysisRuns
    if run_ids:
        fa_ids = session.exec(
            select(FinancialAnalysis.id).where(FinancialAnalysis.analysis_run_id.in_(run_ids))
        ).all()
        if fa_ids:
            session.exec(
                delete(RepaymentSchedule).where(RepaymentSchedule.financial_analysis_id.in_(fa_ids))
            )
            session.exec(
                delete(FinancialScenario).where(FinancialScenario.financial_analysis_id.in_(fa_ids))
            )
            session.exec(delete(FinancialAnalysis).where(FinancialAnalysis.id.in_(fa_ids)))

        session.exec(delete(MarketAnalysis).where(MarketAnalysis.analysis_run_id.in_(run_ids)))
        session.exec(
            delete(CompetitorAnalysis).where(CompetitorAnalysis.analysis_run_id.in_(run_ids))
        )
        session.exec(delete(SchemeMatch).where(SchemeMatch.analysis_run_id.in_(run_ids)))
        session.exec(
            delete(FeasibilityAnalysis).where(FeasibilityAnalysis.analysis_run_id.in_(run_ids))
        )
        session.exec(delete(AIAnalysis).where(AIAnalysis.analysis_run_id.in_(run_ids)))

    # 4. Delete Messages under Conversations
    if conv_ids:
        session.exec(delete(Message).where(Message.conversation_id.in_(conv_ids)))

    # 5. Delete DebtPayments under Debts
    if debt_ids:
        session.exec(delete(DebtPayment).where(DebtPayment.debt_id.in_(debt_ids)))

    # 6. Delete BudgetItems under Budgets
    if budget_ids:
        session.exec(delete(BudgetItem).where(BudgetItem.budget_id.in_(budget_ids)))

    # 7. Delete SavingsTransactions under SavingsGoals
    if goal_ids:
        session.exec(delete(SavingsTransaction).where(SavingsTransaction.goal_id.in_(goal_ids)))

    # 8. Delete user-level domain records
    session.exec(delete(Report).where(Report.user_id == profile_id))
    session.exec(delete(Conversation).where(Conversation.user_id == profile_id))
    session.exec(delete(AnalysisRun).where(AnalysisRun.user_id == profile_id))

    session.exec(delete(Expense).where(Expense.profile_id == profile_id))
    session.exec(delete(CashFlowEntry).where(CashFlowEntry.profile_id == profile_id))
    session.exec(delete(CashFlowSummary).where(CashFlowSummary.profile_id == profile_id))
    session.exec(delete(SavingsGoal).where(SavingsGoal.profile_id == profile_id))
    session.exec(delete(Budget).where(Budget.profile_id == profile_id))
    session.exec(delete(Debt).where(Debt.profile_id == profile_id))
    session.exec(delete(Borrowing).where(Borrowing.profile_id == profile_id))
    session.exec(delete(CreditScore).where(CreditScore.profile_id == profile_id))

    # 9. Delete system records
    session.exec(delete(UserSettings).where(UserSettings.profile_id == profile_id))
    session.exec(delete(PrivacyConsent).where(PrivacyConsent.profile_id == profile_id))
    session.exec(delete(RecycleBinItem).where(RecycleBinItem.profile_id == profile_id))

    # 10. Delete profile row
    session.exec(delete(Profile).where(Profile.id == profile_id))
    session.commit()

    return {
        "status": "success",
        "message": "User account and all associated data deleted successfully.",
    }
