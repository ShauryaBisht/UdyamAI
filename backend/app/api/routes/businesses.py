from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List
from app.database import get_session
from app.schemas.business import BusinessCategoryResponse
from app.services.business_service import BusinessService

router = APIRouter()

@router.get("", response_model=List[BusinessCategoryResponse])
def get_business_categories(db: Session = Depends(get_session)):
    return BusinessService.get_business_categories(db)
