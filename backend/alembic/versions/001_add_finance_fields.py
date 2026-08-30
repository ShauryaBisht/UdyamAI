"""add finance fields and backfill nulls

Revision ID: 001_add_finance_fields
Revises:
Create Date: 2026-08-31 02:00:00.000000

"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "001_add_finance_fields"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add non-breaking nullable columns to scheme_rules
    op.add_column("scheme_rules", sa.Column("payment_frequency", sa.String(), nullable=True))
    op.add_column(
        "scheme_rules", sa.Column("moratorium_interest_treatment", sa.String(), nullable=True)
    )

    # 2. Add non-breaking nullable columns to repayment_schedules
    op.add_column("repayment_schedules", sa.Column("opening_balance", sa.Float(), nullable=True))
    op.add_column(
        "repayment_schedules",
        sa.Column(
            "verification_required", sa.Boolean(), nullable=True, server_default=sa.text("false")
        ),
    )

    # 3. Execute batch backfill SQL for existing null rows
    op.execute(
        "UPDATE scheme_rules SET payment_frequency = 'monthly' WHERE payment_frequency IS NULL;"
    )
    op.execute(
        "UPDATE repayment_schedules SET opening_balance = COALESCE(opening_balance, remaining_principal, principal_amount, 0) WHERE opening_balance IS NULL;"
    )
    op.execute(
        "UPDATE repayment_schedules SET verification_required = false WHERE verification_required IS NULL;"
    )


def downgrade() -> None:
    # Safe reversible downgrade path
    op.drop_column("repayment_schedules", "verification_required")
    op.drop_column("repayment_schedules", "opening_balance")
    op.drop_column("scheme_rules", "moratorium_interest_treatment")
    op.drop_column("scheme_rules", "payment_frequency")
