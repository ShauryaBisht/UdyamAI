from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database import get_session
from app.schemas.finance import FinanceCalculateRequest, FinanceCalculateResponse
from app.services.finance_service import FinanceService

router = APIRouter()


@router.post("/calculate", response_model=FinanceCalculateResponse)
def calculate_finance(request: FinanceCalculateRequest, session: Session = Depends(get_session)):
    return FinanceService.calculate_finance(request, session=session)
