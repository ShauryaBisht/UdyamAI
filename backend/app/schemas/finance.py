from pydantic import BaseModel, Field
from typing import List, Optional

class FinanceCalculateRequest(BaseModel):
    desired_project_cost: float = Field(..., gt=0, description="Desired total project/setup cost")
    available_capital: float = Field(..., ge=0, description="Available capital/own investment of the entrepreneur")
    loan_percent: Optional[float] = Field(default=None, ge=0, le=100, description="Percentage of project cost to be funded by loan")
    interest_rate: float = Field(..., ge=0, le=100, description="Annual interest rate percentage")
    tenure_months: int = Field(..., gt=0, description="Repayment period in months")
    moratorium_months: Optional[int] = Field(default=0, ge=0, description="Moratorium period in months (payment of principal/interest paused)")

class RepaymentScheduleItemResponse(BaseModel):
    period_number: int
    principal_amount: float
    interest_amount: float
    payment_amount: float
    remaining_principal: float
    is_moratorium: bool

class FinanceCalculateResponse(BaseModel):
    desired_project_cost: float
    available_capital: float
    required_contribution: float
    margin_gap: float
    calculated_loan: float
    monthly_emi: float
    total_interest: float
    total_repayment: float
    repayment_schedule: List[RepaymentScheduleItemResponse]
