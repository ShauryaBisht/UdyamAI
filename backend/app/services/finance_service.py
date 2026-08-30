"""
Finance Service for UdyamAI.
Handles database lookup for scheme rules, calculation orchestration, and DB persistence.
"""

from sqlmodel import Session, select

from app.finance.calculator import calculate_finance_engine
from app.models.finance import FinancialAnalysis, FinancialScenario, RepaymentSchedule
from app.models.scheme import SchemeRule
from app.schemas.finance import (
    FinanceCalculateRequest,
    FinanceCalculateResponse,
    SchemeRuleInput,
)


class FinanceService:
    @staticmethod
    def calculate_finance(
        request: FinanceCalculateRequest, session: Session | None = None
    ) -> FinanceCalculateResponse:
        """
        Orchestrates financial calculations using dynamic scheme rules.
        """
        rule = None

        # 1. Look up scheme rule from DB if scheme_rule_id or scheme_id is provided
        if session is not None:
            if request.scheme_rule_id is not None:
                rule = session.exec(
                    select(SchemeRule).where(SchemeRule.id == request.scheme_rule_id)
                ).first()
            elif request.scheme_id is not None:
                rule = session.exec(
                    select(SchemeRule).where(SchemeRule.scheme_id == request.scheme_id)
                ).first()

        # 2. Use scheme_rule_override if provided
        if rule is None and request.scheme_rule_override is not None:
            rule = request.scheme_rule_override

        # 3. Fallback to inline parameters provided directly on request
        if rule is None:
            b_percent = request.beneficiary_contribution_percent
            if b_percent is None:
                if request.loan_percent is not None:
                    b_percent = max(0.0, 100.0 - request.loan_percent)
                else:
                    b_percent = 10.0  # default beneficiary contribution percentage

            l_percent = request.loan_percent
            if l_percent is None:
                l_percent = max(0.0, 100.0 - b_percent)

            rule = SchemeRuleInput(
                beneficiary_contribution_percent=b_percent,
                loan_percent=l_percent,
                interest_rate=request.interest_rate if request.interest_rate is not None else 8.5,
                tenure_months=request.tenure_months if request.tenure_months is not None else 84,
                moratorium_months=request.moratorium_months or 0,
            )

        # Execute calculations
        response = calculate_finance_engine(request, rule)

        # 4. Optional DB persistence if analysis_run_id and session are present
        if (
            session is not None
            and request.analysis_run_id is not None
            and response.status == "success"
        ):
            financial_record = FinancialAnalysis(
                analysis_run_id=request.analysis_run_id,
                scheme_id=request.scheme_id,
                available_capital=response.available_capital,
                required_contribution=response.required_contribution,
                desired_project_cost=response.desired_project_cost,
                feasible_project_cost=response.feasible_project_cost,
                margin_gap=response.margin_gap,
                calculated_loan=response.potential_loan,
                interest_rate=response.interest_rate,
                tenure_months=response.tenure_months,
                moratorium_months=response.moratorium_months,
                monthly_emi=response.monthly_emi,
                total_interest=response.total_interest,
                total_repayment=response.total_repayment,
                working_capital=response.working_capital,
                monthly_revenue=request.monthly_revenue,
                monthly_operating_cost=request.monthly_operating_cost,
                monthly_profit=(
                    request.monthly_revenue - request.monthly_operating_cost
                    if request.monthly_revenue is not None
                    and request.monthly_operating_cost is not None
                    else None
                ),
                calculation_version="v2.0_phase5",
            )
            session.add(financial_record)
            session.commit()
            session.refresh(financial_record)

            # Persist repayment schedule items
            for item in response.repayment_schedule:
                sched_item = RepaymentSchedule(
                    financial_analysis_id=financial_record.id,
                    period_number=item.period_number,
                    principal_amount=item.principal_amount,
                    interest_amount=item.interest_amount,
                    payment_amount=item.payment_amount,
                    remaining_principal=item.remaining_principal,
                    is_moratorium=item.is_moratorium,
                )
                session.add(sched_item)

            # Persist financial scenarios
            for scen in response.financial_scenarios:
                scen_item = FinancialScenario(
                    financial_analysis_id=financial_record.id,
                    scenario_type=scen.scenario_type,
                    monthly_revenue=scen.monthly_revenue,
                    monthly_expenses=scen.monthly_expenses,
                    monthly_profit=scen.monthly_profit,
                    cash_flow=scen.cash_flow,
                    repayment_coverage=scen.repayment_coverage,
                )
                session.add(scen_item)

            session.commit()

        return response
