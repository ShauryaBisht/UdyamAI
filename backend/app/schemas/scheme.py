from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime

class SchemeResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    agency_name: Optional[str] = None
    state: Optional[str] = None
    active: bool
    official_url: Optional[str] = None
    source: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
