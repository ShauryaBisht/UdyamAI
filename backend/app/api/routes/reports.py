from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.database import get_session
from app.schemas.report import ReportResponse
from app.services.report_service import ReportService

router = APIRouter()


@router.get("/{id}", response_model=ReportResponse)
def get_report(id: UUID, db: Session = Depends(get_session)):
    report = ReportService.get_report(db, id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report with id {id} not found")
    return report
