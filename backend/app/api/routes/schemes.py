from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database import get_session
from app.schemas.scheme import SchemeResponse
from app.services.scheme_service import SchemeService

router = APIRouter()


@router.get("", response_model=list[SchemeResponse])
def get_schemes(db: Session = Depends(get_session)):
    return SchemeService.get_schemes(db)
