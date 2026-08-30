from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.database import get_session
from app.schemas.feasibility import (
    AnalysisRunCreate,
    AnalysisRunResponse,
    AnalysisStatusResponse,
)
from app.services.analysis_service import AnalysisService

router = APIRouter()


@router.post("", response_model=AnalysisRunResponse, status_code=201)
@router.post("/", response_model=AnalysisRunResponse, status_code=201, include_in_schema=False)
def create_analysis(run_data: AnalysisRunCreate, db: Session = Depends(get_session)):
    return AnalysisService.create_analysis_run(db, run_data)


@router.get("/{id}", response_model=AnalysisRunResponse)
def get_analysis(id: UUID, db: Session = Depends(get_session)):
    run = AnalysisService.get_analysis_run(db, id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Analysis run with id {id} not found")
    return run


@router.get("/{id}/status", response_model=AnalysisStatusResponse)
def get_analysis_status(id: UUID, db: Session = Depends(get_session)):
    status_response = AnalysisService.get_analysis_run_status(db, id)
    if not status_response:
        raise HTTPException(status_code=404, detail=f"Analysis run with id {id} not found")
    return status_response
