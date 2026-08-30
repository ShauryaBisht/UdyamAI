from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class BusinessCategoryResponse(BaseModel):
    id: UUID
    name: str
    sector: str | None = None
    description: str | None = None
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class BusinessModelResponse(BaseModel):
    id: UUID
    business_category_id: UUID
    name: str
    description: str | None = None
    startup_cost_min: float | None = None
    startup_cost_max: float | None = None
    working_capital: float | None = None
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
