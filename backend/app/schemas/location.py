from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class DistrictResponse(BaseModel):
    id: UUID
    name: str
    state: str
    lgd_code: Optional[str] = None

    model_config = {"from_attributes": True}

class TalukaResponse(BaseModel):
    id: UUID
    name: str
    district_id: UUID
    lgd_code: Optional[str] = None

    model_config = {"from_attributes": True}

class VillageResponse(BaseModel):
    id: UUID
    name: str
    district_id: UUID
    taluka_id: UUID
    gram_panchayat_id: UUID
    lgd_code: Optional[str] = None
    pin_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    model_config = {"from_attributes": True}
