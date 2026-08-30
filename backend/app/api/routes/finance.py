from fastapi import APIRouter

from app.schemas.finance import FinanceCalculateRequest, FinanceCalculateResponse
from app.services.finance_service import FinanceService

router = APIRouter()


@router.post("/calculate", response_model=FinanceCalculateResponse)
def calculate_finance(request: FinanceCalculateRequest):
    return FinanceService.calculate_finance(request)
