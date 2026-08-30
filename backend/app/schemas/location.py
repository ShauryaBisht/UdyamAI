from uuid import UUID

from pydantic import BaseModel, Field


class DistrictResponse(BaseModel):
    id: UUID
    name: str = Field(..., min_length=1, max_length=150)
    state: str = Field(..., min_length=1, max_length=150)
    lgd_code: str | None = Field(default=None, max_length=20)

    model_config = {"from_attributes": True}


class TalukaResponse(BaseModel):
    id: UUID
    name: str = Field(..., min_length=1, max_length=150)
    district_id: UUID
    lgd_code: str | None = Field(default=None, max_length=20)

    model_config = {"from_attributes": True}


class VillageResponse(BaseModel):
    id: UUID
    name: str = Field(..., min_length=1, max_length=150)
    district_id: UUID
    taluka_id: UUID
    gram_panchayat_id: UUID | None = None
    lgd_code: str | None = Field(default=None, max_length=20)
    pin_code: str | None = Field(
        default=None, pattern=r"^\d{6}$", description="6-digit Indian PIN code"
    )
    latitude: float | None = Field(
        default=None, ge=-90.0, le=90.0, description="Latitude between -90 and 90"
    )
    longitude: float | None = Field(
        default=None, ge=-180.0, le=180.0, description="Longitude between -180 and 180"
    )

    model_config = {"from_attributes": True}


class LocationQuery(BaseModel):
    search: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    district_id: UUID | None = None
    taluka_id: UUID | None = None
    limit: int = Field(default=50, ge=1, le=500, description="Maximum number of items to return")
    offset: int = Field(default=0, ge=0, description="Pagination offset")
