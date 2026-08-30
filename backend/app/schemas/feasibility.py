from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional
from datetime import datetime

class AnalysisRunCreate(BaseModel):
    user_id: UUID
    location_id: Optional[UUID] = None
    business_category_id: Optional[UUID] = None
    available_capital: Optional[float] = Field(default=None, ge=0)

class AnalysisRunResponse(BaseModel):
    id: UUID
    user_id: UUID
    location_id: Optional[UUID] = None
    business_category_id: Optional[UUID] = None
    available_capital: Optional[float] = None
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
