"""Add performance B-tree indexes on foreign keys and compound query filters

Revision ID: 008_performance_indexes
Revises: 007_whatsapp_conversation_unique
Create Date: 2026-09-23 00:05:00.000000

"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "008_performance_indexes"
down_revision = "007_whatsapp_conversation_unique"
branch_labels = None
depends_on = None


def _indexes(inspector, table: str) -> set[str]:
    try:
        return {i["name"] for i in inspector.get_indexes(table) if i.get("name")}
    except Exception:
        return set()


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    # 1. Analysis Runs & Feasibility
    if "analysis_runs" in tables:
        idx = _indexes(inspector, "analysis_runs")
        if "ix_analysis_runs_user_id" not in idx:
            op.create_index("ix_analysis_runs_user_id", "analysis_runs", ["user_id"])
        if "ix_analysis_runs_created_at" not in idx:
            op.create_index("ix_analysis_runs_created_at", "analysis_runs", ["created_at"])

    if "feasibility_analyses" in tables:
        idx = _indexes(inspector, "feasibility_analyses")
        if "ix_feasibility_analyses_analysis_run_id" not in idx:
            op.create_index(
                "ix_feasibility_analyses_analysis_run_id",
                "feasibility_analyses",
                ["analysis_run_id"],
            )

    if "scheme_matches" in tables:
        idx = _indexes(inspector, "scheme_matches")
        if "ix_scheme_matches_analysis_run_id" not in idx:
            op.create_index(
                "ix_scheme_matches_analysis_run_id", "scheme_matches", ["analysis_run_id"]
            )
        if "ix_scheme_matches_scheme_id" not in idx:
            op.create_index("ix_scheme_matches_scheme_id", "scheme_matches", ["scheme_id"])

    if "reports" in tables:
        idx = _indexes(inspector, "reports")
        if "ix_reports_user_id" not in idx:
            op.create_index("ix_reports_user_id", "reports", ["user_id"])
        if "ix_reports_analysis_run_id" not in idx:
            op.create_index("ix_reports_analysis_run_id", "reports", ["analysis_run_id"])

    # 2. Financial tables (Composite & Filter Indexes)
    if "expenses" in tables:
        idx = _indexes(inspector, "expenses")
        if "ix_expenses_profile_id_deleted" not in idx:
            op.create_index("ix_expenses_profile_id_deleted", "expenses", ["profile_id", "deleted"])

    if "cash_flow_entries" in tables:
        idx = _indexes(inspector, "cash_flow_entries")
        if "ix_cash_flow_entries_profile_type_deleted" not in idx:
            op.create_index(
                "ix_cash_flow_entries_profile_type_deleted",
                "cash_flow_entries",
                ["profile_id", "entry_type", "deleted"],
            )

    if "savings_goals" in tables:
        idx = _indexes(inspector, "savings_goals")
        if "ix_savings_goals_profile_id_deleted" not in idx:
            op.create_index(
                "ix_savings_goals_profile_id_deleted", "savings_goals", ["profile_id", "deleted"]
            )

    if "budgets" in tables:
        idx = _indexes(inspector, "budgets")
        if "ix_budgets_profile_id_deleted" not in idx:
            op.create_index("ix_budgets_profile_id_deleted", "budgets", ["profile_id", "deleted"])

    if "debts" in tables:
        idx = _indexes(inspector, "debts")
        if "ix_debts_profile_id_deleted" not in idx:
            op.create_index("ix_debts_profile_id_deleted", "debts", ["profile_id", "deleted"])

    if "borrowings" in tables:
        idx = _indexes(inspector, "borrowings")
        if "ix_borrowings_profile_id_deleted" not in idx:
            op.create_index(
                "ix_borrowings_profile_id_deleted", "borrowings", ["profile_id", "deleted"]
            )

    if "credit_scores" in tables:
        idx = _indexes(inspector, "credit_scores")
        if "ix_credit_scores_profile_id_recorded_date" not in idx:
            op.create_index(
                "ix_credit_scores_profile_id_recorded_date",
                "credit_scores",
                ["profile_id", "recorded_date"],
            )

    if "recycle_bin_items" in tables:
        idx = _indexes(inspector, "recycle_bin_items")
        if "ix_recycle_bin_items_profile_id_restored" not in idx:
            op.create_index(
                "ix_recycle_bin_items_profile_id_restored",
                "recycle_bin_items",
                ["profile_id", "restored"],
            )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "recycle_bin_items" in tables and "ix_recycle_bin_items_profile_id_restored" in _indexes(
        inspector, "recycle_bin_items"
    ):
        op.drop_index("ix_recycle_bin_items_profile_id_restored", table_name="recycle_bin_items")
    if "credit_scores" in tables and "ix_credit_scores_profile_id_recorded_date" in _indexes(
        inspector, "credit_scores"
    ):
        op.drop_index("ix_credit_scores_profile_id_recorded_date", table_name="credit_scores")
    if "borrowings" in tables and "ix_borrowings_profile_id_deleted" in _indexes(
        inspector, "borrowings"
    ):
        op.drop_index("ix_borrowings_profile_id_deleted", table_name="borrowings")
    if "debts" in tables and "ix_debts_profile_id_deleted" in _indexes(inspector, "debts"):
        op.drop_index("ix_debts_profile_id_deleted", table_name="debts")
    if "budgets" in tables and "ix_budgets_profile_id_deleted" in _indexes(inspector, "budgets"):
        op.drop_index("ix_budgets_profile_id_deleted", table_name="budgets")
    if "savings_goals" in tables and "ix_savings_goals_profile_id_deleted" in _indexes(
        inspector, "savings_goals"
    ):
        op.drop_index("ix_savings_goals_profile_id_deleted", table_name="savings_goals")
    if "cash_flow_entries" in tables and "ix_cash_flow_entries_profile_type_deleted" in _indexes(
        inspector, "cash_flow_entries"
    ):
        op.drop_index("ix_cash_flow_entries_profile_type_deleted", table_name="cash_flow_entries")
    if "expenses" in tables and "ix_expenses_profile_id_deleted" in _indexes(inspector, "expenses"):
        op.drop_index("ix_expenses_profile_id_deleted", table_name="expenses")
    if "reports" in tables:
        idx = _indexes(inspector, "reports")
        if "ix_reports_analysis_run_id" in idx:
            op.drop_index("ix_reports_analysis_run_id", table_name="reports")
        if "ix_reports_user_id" in idx:
            op.drop_index("ix_reports_user_id", table_name="reports")
    if "scheme_matches" in tables:
        idx = _indexes(inspector, "scheme_matches")
        if "ix_scheme_matches_scheme_id" in idx:
            op.drop_index("ix_scheme_matches_scheme_id", table_name="scheme_matches")
        if "ix_scheme_matches_analysis_run_id" in idx:
            op.drop_index("ix_scheme_matches_analysis_run_id", table_name="scheme_matches")
    if "feasibility_analyses" in tables and "ix_feasibility_analyses_analysis_run_id" in _indexes(
        inspector, "feasibility_analyses"
    ):
        op.drop_index("ix_feasibility_analyses_analysis_run_id", table_name="feasibility_analyses")
    if "analysis_runs" in tables:
        idx = _indexes(inspector, "analysis_runs")
        if "ix_analysis_runs_created_at" in idx:
            op.drop_index("ix_analysis_runs_created_at", table_name="analysis_runs")
        if "ix_analysis_runs_user_id" in idx:
            op.drop_index("ix_analysis_runs_user_id", table_name="analysis_runs")
