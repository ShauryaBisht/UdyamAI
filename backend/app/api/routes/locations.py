from uuid import UUID

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database import get_session
from app.schemas.location import DistrictResponse, TalukaResponse, VillageResponse
from app.services.location_service import LocationService

router = APIRouter()


@router.get("/districts", response_model=list[DistrictResponse])
def get_districts(db: Session = Depends(get_session)):
    return LocationService.get_districts(db)


@router.get("/talukas", response_model=list[TalukaResponse])
def get_talukas(district_id: UUID | None = None, db: Session = Depends(get_session)):
    return LocationService.get_talukas(db, district_id=district_id)


@router.get("/villages", response_model=list[VillageResponse])
def get_villages(taluka_id: UUID | None = None, db: Session = Depends(get_session)):
    return LocationService.get_villages(db, taluka_id=taluka_id)
