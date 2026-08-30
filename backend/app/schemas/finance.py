from pydantic import BaseModel, Field


class FinanceCalculateRequest(BaseModel):
    desired_project_cost: float = Field(
        ...,
        gt=0,
        le=100_000_000.0,
        description="Desired total project/setup cost in INR (gt 0, max 10 Cr)",
    )
    available_capital: float = Field(
        ...,
        ge=0,
        le=100_000_000.0,
        description="Available capital/own equity investment in INR (ge 0, max 10 Cr)",
    )
    loan_percent: float | None = Field(
        default=None,
        ge=0.0,
        le=100.0,
        description="Percentage of project cost funded by loan (0-100%)",
    )
    interest_rate: float = Field(
        ..., ge=0.0, le=100.0, description="Annual interest rate percentage (0-100%)"
    )
    tenure_months: int = Field(
        ..., gt=0, le=360, description="Repayment period in months (1 to 360 months)"
    )
    moratorium_months: int | None = Field(
        default=0, ge=0, le=60, description="Moratorium period in months (0 to 60 months)"
    )


class RepaymentScheduleItemResponse(BaseModel):
    period_number: int = Field(..., gt=0, description="Period number (1-based index)")
    principal_amount: float = Field(..., ge=0, description="Principal paid in this period")
    interest_amount: float = Field(..., ge=0, description="Interest paid in this period")
    payment_amount: float = Field(..., ge=0, description="Total payment amount for period")
    remaining_principal: float = Field(
        ..., ge=0, description="Remaining loan principal after payment"
    )
    is_moratorium: bool = Field(..., description="Whether this period falls in moratorium")


class FinanceCalculateResponse(BaseModel):
    desired_project_cost: float = Field(..., gt=0)
    available_capital: float = Field(..., ge=0)
    required_contribution: float = Field(..., ge=0)
    margin_gap: float = Field(...)
    calculated_loan: float = Field(..., ge=0)
    monthly_emi: float = Field(..., ge=0)
    total_interest: float = Field(..., ge=0)
    total_repayment: float = Field(..., ge=0)
    repayment_schedule: list[RepaymentScheduleItemResponse]
