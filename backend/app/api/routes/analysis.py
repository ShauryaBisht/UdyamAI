from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from uuid import UUID
from app.database import get_session
from app.schemas.feasibility import AnalysisRunCreate, AnalysisRunResponse
from app.services.analysis_service import AnalysisService

router = APIRouter()

@router.post("", response_model=AnalysisRunResponse, status_code=201)
def create_analysis(run_data: AnalysisRunCreate, db: Session = Depends(get_session)):
    return AnalysisService.create_analysis_run(db, run_data)

@router.get("/{id}", response_model=AnalysisRunResponse)
def get_analysis(id: UUID, db: Session = Depends(get_session)):
    run = AnalysisService.get_analysis_run(db, id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Analysis run with id {id} not found")
    return run
