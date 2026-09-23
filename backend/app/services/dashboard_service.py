"""Dashboard overview service.

Builds the personalised "what have I opted into" view for the signed-in
user:
- Financial tools (FinCompass) with per-module activity summaries
- Feasibility analysis runs the user has created
- Government schemes matched across those runs (deduplicated)
- Generated reports
"""

from uuid import UUID

from sqlalchemy import case, func
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from app.models.analysis import AnalysisRun, FeasibilityAnalysis
from app.models.budget import Budget
from app.models.cash_flow import CashFlowEntry
from app.models.credit import Borrowing, CreditScore
from app.models.debt import Debt
from app.models.expenses import Expense
from app.models.location import Taluka, Village
from app.models.report import Report
from app.models.savings import SavingsGoal
from app.models.scheme import Scheme, SchemeMatch
from app.models.system import RecycleBinItem
from app.models.user import Profile
from app.schemas.common import SchemeMatchStatus
from app.schemas.dashboard import (
    AnalysisRunOverview,
    BorrowingOverview,
    BudgetOverview,
    CashFlowOverview,
    CreditOverview,
    DashboardOverview,
    DebtOverview,
    ExpenseOverview,
    FinanceToolsOverview,
    RecycleBinOverview,
    ReportOverviewItem,
    SavingsOverview,
    SchemeOverviewItem,
)

_RECENT_ANALYSES_LIMIT = 10


def _sum_or_zero(row) -> float:
    return float(row or 0.0)


class DashboardService:
    """Reads the personalised dashboard data for one profile."""

    @staticmethod
    def build_overview(db: Session, profile: Profile) -> DashboardOverview:
        tools = DashboardService._finance_tools(db, profile.id)
        analyses = DashboardService._analyses(db, profile.id)
        schemes = DashboardService._matched_schemes(db, profile.id)
        reports = DashboardService._reports(db, profile.id)
        return DashboardOverview(
            finance=tools,
            analyses=analyses,
            schemes=schemes,
            reports=reports,
        )

    # ------------------------------------------------------------------
    # Financial tools
    # ------------------------------------------------------------------

    @staticmethod
    def _finance_tools(db: Session, profile_id: UUID) -> FinanceToolsOverview:
        # 1. Expenses (Count & Total in 1 query)
        exp_row = db.exec(
            select(
                func.count(Expense.id),
                func.coalesce(func.sum(Expense.amount), 0.0),
            ).where(Expense.profile_id == profile_id, ~Expense.deleted)
        ).first() or (0, 0.0)
        expenses_count = exp_row[0] or 0
        expenses_total = float(exp_row[1] or 0.0)

        # 2. Cash Flow (Count, Income Sum, Expense Sum in 1 query)
        cf_row = db.exec(
            select(
                func.count(CashFlowEntry.id),
                func.coalesce(
                    func.sum(
                        case(
                            (CashFlowEntry.entry_type == "income", CashFlowEntry.amount),
                            else_=0.0,
                        )
                    ),
                    0.0,
                ),
                func.coalesce(
                    func.sum(
                        case(
                            (CashFlowEntry.entry_type == "expense", CashFlowEntry.amount),
                            else_=0.0,
                        )
                    ),
                    0.0,
                ),
            ).where(CashFlowEntry.profile_id == profile_id, ~CashFlowEntry.deleted)
        ).first() or (0, 0.0, 0.0)
        cf_count = cf_row[0] or 0
        cf_income = float(cf_row[1] or 0.0)
        cf_expenses = float(cf_row[2] or 0.0)

        # 3. Savings Goals
        savings_goals = db.exec(
            select(SavingsGoal.current_amount, SavingsGoal.target_amount).where(
                SavingsGoal.profile_id == profile_id, ~SavingsGoal.deleted
            )
        ).all()
        total_saved = sum(g[0] or 0.0 for g in savings_goals)
        total_target = sum(g[1] or 0.0 for g in savings_goals)
        savings_progress = round(total_saved / total_target * 100, 1) if total_target > 0 else 0.0

        # 4. Budgets
        budgets = db.exec(
            select(Budget.status, Budget.total_income_target, Budget.total_expense_target).where(
                Budget.profile_id == profile_id, ~Budget.deleted
            )
        ).all()
        budgets_active = sum(1 for b in budgets if b[0] == "active")
        total_inc_target = sum(b[1] or 0.0 for b in budgets)
        total_exp_target = sum(b[2] or 0.0 for b in budgets)

        # 5. Debts
        debts = db.exec(
            select(Debt.outstanding_amount, Debt.principal_amount, Debt.emi_amount).where(
                Debt.profile_id == profile_id, ~Debt.deleted
            )
        ).all()
        total_outstanding = sum(d[0] or 0.0 for d in debts)
        total_principal = sum(d[1] or 0.0 for d in debts)
        total_emi = sum(d[2] or 0.0 for d in debts)

        # 6. Borrowings
        borrowings = db.exec(
            select(Borrowing.status, Borrowing.requested_amount, Borrowing.approved_amount).where(
                Borrowing.profile_id == profile_id, ~Borrowing.deleted
            )
        ).all()
        borrow_exploring = sum(1 for b in borrowings if b[0] == "exploring")
        borrow_applied = sum(1 for b in borrowings if b[0] in ("applied", "under_review"))
        borrow_approved = sum(1 for b in borrowings if b[0] in ("approved", "disbursed"))
        total_requested = sum(b[1] or 0.0 for b in borrowings)
        total_approved = sum(b[2] or 0.0 for b in borrowings)

        # 7. Credit Score (latest only + count)
        latest_credit = db.exec(
            select(CreditScore.score, CreditScore.rating)
            .where(CreditScore.profile_id == profile_id)
            .order_by(CreditScore.recorded_date.desc())
            .limit(1)
        ).first()
        credit_count = (
            db.scalar(
                select(func.count(CreditScore.id)).where(CreditScore.profile_id == profile_id)
            )
            or 0
        )

        # 8. Recycle bin
        recycle_count = (
            db.scalar(
                select(func.count(RecycleBinItem.id)).where(
                    RecycleBinItem.profile_id == profile_id, ~RecycleBinItem.restored
                )
            )
            or 0
        )

        return FinanceToolsOverview(
            expenses=ExpenseOverview(count=expenses_count, total=round(expenses_total, 2)),
            cash_flow=CashFlowOverview(
                count=cf_count,
                total_income=round(cf_income, 2),
                total_expenses=round(cf_expenses, 2),
                net=round(cf_income - cf_expenses, 2),
            ),
            savings=SavingsOverview(
                goals=len(savings_goals),
                total_saved=round(total_saved, 2),
                total_target=round(total_target, 2),
                progress_percent=savings_progress,
            ),
            budgets=BudgetOverview(
                count=len(budgets),
                active=budgets_active,
                total_income_target=round(total_inc_target, 2),
                total_expense_target=round(total_exp_target, 2),
            ),
            debts=DebtOverview(
                count=len(debts),
                total_outstanding=round(total_outstanding, 2),
                total_principal=round(total_principal, 2),
                total_monthly_emi=round(total_emi, 2),
            ),
            borrowings=BorrowingOverview(
                count=len(borrowings),
                exploring=borrow_exploring,
                applied=borrow_applied,
                approved=borrow_approved,
                total_requested=round(total_requested, 2),
                total_approved=round(total_approved, 2),
            ),
            credit=CreditOverview(
                records=credit_count,
                latest_score=latest_credit[0] if latest_credit else None,
                latest_rating=latest_credit[1] if latest_credit else None,
            ),
            recycle_bin=RecycleBinOverview(count=recycle_count),
        )

    # ------------------------------------------------------------------
    # Analyses, matched schemes, reports
    # ------------------------------------------------------------------

    @staticmethod
    def _analyses(db: Session, profile_id: UUID) -> list[AnalysisRunOverview]:
        runs = db.exec(
            select(AnalysisRun)
            .options(
                selectinload(AnalysisRun.business_category),
                selectinload(AnalysisRun.location)
                .selectinload(Village.taluka)
                .selectinload(Taluka.district),
            )
            .where(AnalysisRun.user_id == profile_id)
            .order_by(AnalysisRun.created_at.desc())
            .limit(_RECENT_ANALYSES_LIMIT)
        ).all()

        if not runs:
            return []

        run_ids = [r.id for r in runs]
        # Best (latest) feasibility score per run.
        feasibility_rows = db.exec(
            select(FeasibilityAnalysis.analysis_run_id, FeasibilityAnalysis.overall_score)
            .where(FeasibilityAnalysis.analysis_run_id.in_(run_ids))
            .order_by(FeasibilityAnalysis.created_at.desc())
        ).all()
        score_by_run: dict[UUID, float | None] = {}
        for run_id, score in feasibility_rows:
            if run_id not in score_by_run:
                score_by_run[run_id] = score

        overview: list[AnalysisRunOverview] = []
        for run in runs:
            village = run.location
            taluka = village.taluka if village else None
            district = taluka.district if taluka else None
            overview.append(
                AnalysisRunOverview(
                    id=run.id,
                    status=run.status,
                    created_at=run.created_at,
                    completed_at=run.completed_at,
                    business_category_name=(
                        run.business_category.name if run.business_category else None
                    ),
                    village_name=village.name if village else None,
                    taluka_name=taluka.name if taluka else None,
                    district_name=district.name if district else None,
                    overall_score=score_by_run.get(run.id),
                )
            )
        return overview

    @staticmethod
    def _matched_schemes(db: Session, profile_id: UUID) -> list[SchemeOverviewItem]:
        run_ids_subquery = (
            select(AnalysisRun.id).where(AnalysisRun.user_id == profile_id).scalar_subquery()
        )

        rows = db.exec(
            select(SchemeMatch, Scheme)
            .join(Scheme, Scheme.id == SchemeMatch.scheme_id)
            .where(
                SchemeMatch.analysis_run_id.in_(run_ids_subquery),
                SchemeMatch.match_status == SchemeMatchStatus.POTENTIAL_MATCH,
            )
            .order_by(SchemeMatch.match_score.desc())
        ).all()

        best_by_scheme: dict[UUID, SchemeOverviewItem] = {}
        analyses_count: dict[UUID, int] = {}
        for match, scheme in rows:
            analyses_count[match.scheme_id] = analyses_count.get(match.scheme_id, 0) + 1
            existing = best_by_scheme.get(match.scheme_id)
            if existing is None or (match.match_score or 0) > (existing.match_score or 0):
                best_by_scheme[match.scheme_id] = SchemeOverviewItem(
                    scheme_id=scheme.id,
                    name=scheme.name,
                    agency_name=scheme.agency_name,
                    match_status=match.match_status.value,
                    match_score=match.match_score,
                    estimated_loan_amount=match.estimated_loan_amount,
                    matched_analysis_run_id=match.analysis_run_id,
                    analyses_count=1,
                )

        for item in best_by_scheme.values():
            item.analyses_count = analyses_count.get(item.scheme_id, 1)

        # Keep highest score first, rows without a score at the end.
        return sorted(
            best_by_scheme.values(),
            key=lambda s: (0 if s.match_score is None else 1, s.match_score or 0),
            reverse=True,
        )

    @staticmethod
    def _reports(db: Session, profile_id: UUID) -> list[ReportOverviewItem]:
        reports = db.exec(
            select(Report)
            .where(Report.user_id == profile_id)
            .order_by(Report.created_at.desc())
            .limit(20)
        ).all()
        return [
            ReportOverviewItem(
                id=r.id,
                analysis_run_id=r.analysis_run_id,
                title=r.title,
                language=r.language,
                created_at=r.created_at,
            )
            for r in reports
        ]
