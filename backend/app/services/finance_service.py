from app.schemas.finance import FinanceCalculateRequest, FinanceCalculateResponse, RepaymentScheduleItemResponse
from typing import List

class FinanceService:
    @staticmethod
    def calculate_finance(request: FinanceCalculateRequest) -> FinanceCalculateResponse:
        desired_project_cost = request.desired_project_cost
        available_capital = request.available_capital
        loan_percent = request.loan_percent
        interest_rate = request.interest_rate
        tenure_months = request.tenure_months
        moratorium_months = request.moratorium_months or 0

        # Calculate loan amount and contributions
        if loan_percent is not None:
            calculated_loan = desired_project_cost * (loan_percent / 100.0)
            required_contribution = desired_project_cost - calculated_loan
            margin_gap = max(0.0, required_contribution - available_capital)
        else:
            # If no loan percent, assume loan covers the gap between project cost and available capital
            if available_capital >= desired_project_cost:
                calculated_loan = 0.0
                required_contribution = desired_project_cost
                margin_gap = 0.0
            else:
                calculated_loan = desired_project_cost - available_capital
                required_contribution = available_capital
                margin_gap = 0.0

        repayment_schedule: List[RepaymentScheduleItemResponse] = []
        
        monthly_rate = (interest_rate / 12.0) / 100.0
        remaining_principal = calculated_loan
        
        # Determine repayment period
        repayment_months = tenure_months - moratorium_months
        if repayment_months <= 0:
            repayment_months = tenure_months
            moratorium_months = 0

        # Calculate monthly EMI for the repayment period
        if calculated_loan <= 0:
            monthly_emi = 0.0
        elif monthly_rate == 0:
            monthly_emi = calculated_loan / repayment_months
        else:
            monthly_emi = calculated_loan * (monthly_rate * ((1 + monthly_rate) ** repayment_months)) / (((1 + monthly_rate) ** repayment_months) - 1)

        total_interest = 0.0
        total_repayment = 0.0

        # Generate schedule month by month
        for month in range(1, tenure_months + 1):
            if month <= moratorium_months:
                # Moratorium month: Interest accrues but principal repayment is deferred
                interest_payment = remaining_principal * monthly_rate
                # Assume interest-only moratorium (user pays only interest, principal deferred)
                principal_payment = 0.0
                payment_amount = interest_payment
                is_mor = True
            else:
                # Repayment month
                if remaining_principal <= 0:
                    principal_payment = 0.0
                    interest_payment = 0.0
                    payment_amount = 0.0
                    is_mor = False
                else:
                    interest_payment = remaining_principal * monthly_rate
                    payment_amount = min(monthly_emi, remaining_principal + interest_payment)
                    principal_payment = payment_amount - interest_payment
                    if principal_payment < 0:
                        principal_payment = 0.0
                    remaining_principal -= principal_payment
                    if remaining_principal < 0.01: # handle rounding
                        principal_payment += remaining_principal
                        payment_amount += remaining_principal
                        remaining_principal = 0.0
                    is_mor = False
            
            total_interest += interest_payment
            total_repayment += payment_amount

            repayment_schedule.append(
                RepaymentScheduleItemResponse(
                    period_number=month,
                    principal_amount=round(principal_payment, 2),
                    interest_amount=round(interest_payment, 2),
                    payment_amount=round(payment_amount, 2),
                    remaining_principal=round(max(0.0, remaining_principal), 2),
                    is_moratorium=is_mor
                )
            )

        return FinanceCalculateResponse(
            desired_project_cost=round(desired_project_cost, 2),
            available_capital=round(available_capital, 2),
            required_contribution=round(required_contribution, 2),
            margin_gap=round(margin_gap, 2),
            calculated_loan=round(calculated_loan, 2),
            monthly_emi=round(monthly_emi, 2),
            total_interest=round(total_interest, 2),
            total_repayment=round(total_repayment, 2),
            repayment_schedule=repayment_schedule
        )
