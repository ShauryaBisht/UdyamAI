from uuid import UUID

from pydantic import BaseModel


class DistrictResponse(BaseModel):
    id: UUID
    name: str
    state: str
    lgd_code: str | None = None

    model_config = {"from_attributes": True}


class TalukaResponse(BaseModel):
    id: UUID
    name: str
    district_id: UUID
    lgd_code: str | None = None

    model_config = {"from_attributes": True}


class VillageResponse(BaseModel):
    id: UUID
    name: str
    district_id: UUID
    taluka_id: UUID
    gram_panchayat_id: UUID
    lgd_code: str | None = None
    pin_code: str | None = None
    latitude: float | None = None
    longitude: float | None = None

    model_config = {"from_attributes": True}
