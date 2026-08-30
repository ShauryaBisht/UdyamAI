"""
EMI calculation module for UdyamAI Finance Engine.
Handles monthly EMI computation and amortization schedules with moratorium support.
"""
from app.schemas.finance import RepaymentScheduleItemResponse


def calculate_monthly_emi(
    loan_amount: float, annual_interest_rate: float, repayment_months: int
) -> float:
    """
    Calculates monthly Equated Monthly Installment (EMI) for given active repayment months.
    Formula: EMI = P * [r(1+r)^n] / [(1+r)^n - 1]
    """
    if loan_amount <= 0 or repayment_months <= 0:
        return 0.0

    monthly_rate = (annual_interest_rate / 12.0) / 100.0
    if monthly_rate == 0:
        return loan_amount / repayment_months

    factor = (1 + monthly_rate) ** repayment_months
    monthly_emi = loan_amount * (monthly_rate * factor) / (factor - 1)
    return monthly_emi


def generate_amortization_schedule(
    loan_amount: float,
    annual_interest_rate: float,
    tenure_months: int,
    moratorium_months: int = 0,
) -> tuple[float, float, float, list[RepaymentScheduleItemResponse]]:
    """
    Generates period-by-period repayment schedule with moratorium handling.
    Returns (monthly_emi, total_interest, total_repayment, repayment_schedule).
    """
    if loan_amount <= 0 or tenure_months <= 0:
        return 0.0, 0.0, 0.0, []

    moratorium_months = max(0, min(moratorium_months, tenure_months - 1))
    repayment_months = tenure_months - moratorium_months

    monthly_emi = calculate_monthly_emi(loan_amount, annual_interest_rate, repayment_months)
    monthly_rate = (annual_interest_rate / 12.0) / 100.0
    remaining_principal = loan_amount

    total_interest = 0.0
    total_repayment = 0.0
    schedule: list[RepaymentScheduleItemResponse] = []

    for month in range(1, tenure_months + 1):
        if month <= moratorium_months:
            interest_payment = remaining_principal * monthly_rate
            principal_payment = 0.0
            payment_amount = interest_payment
            is_mor = True
        else:
            if remaining_principal <= 0:
                interest_payment = 0.0
                principal_payment = 0.0
                payment_amount = 0.0
                is_mor = False
            else:
                interest_payment = remaining_principal * monthly_rate
                payment_amount = min(monthly_emi, remaining_principal + interest_payment)
                principal_payment = max(0.0, payment_amount - interest_payment)
                remaining_principal -= principal_payment

                if remaining_principal < 0.01:
                    principal_payment += remaining_principal
                    payment_amount += remaining_principal
                    remaining_principal = 0.0
                is_mor = False

        total_interest += interest_payment
        total_repayment += payment_amount

        schedule.append(
            RepaymentScheduleItemResponse(
                period_number=month,
                principal_amount=round(principal_payment, 2),
                interest_amount=round(interest_payment, 2),
                payment_amount=round(payment_amount, 2),
                remaining_principal=round(max(0.0, remaining_principal), 2),
                is_moratorium=is_mor,
            )
        )

    return round(monthly_emi, 2), round(total_interest, 2), round(total_repayment, 2), schedule
