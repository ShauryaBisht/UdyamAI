from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AnalysisRunCreate(BaseModel):
    user_id: UUID
    location_id: UUID | None = None
    business_category_id: UUID | None = None
    available_capital: float | None = Field(default=None, ge=0)


class AnalysisRunResponse(BaseModel):
    id: UUID
    user_id: UUID
    location_id: UUID | None = None
    business_category_id: UUID | None = None
    available_capital: float | None = None
    status: str
    created_at: datetime
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}
