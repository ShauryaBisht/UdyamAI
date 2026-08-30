from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime

class BusinessCategoryResponse(BaseModel):
    id: UUID
    name: str
    sector: Optional[str] = None
    description: Optional[str] = None
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class BusinessModelResponse(BaseModel):
    id: UUID
    business_category_id: UUID
    name: str
    description: Optional[str] = None
    startup_cost_min: Optional[float] = None
    startup_cost_max: Optional[float] = None
    working_capital: Optional[float] = None
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
