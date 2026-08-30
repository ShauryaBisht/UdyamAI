from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class SchemeResponse(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    agency_name: str | None = None
    state: str | None = None
    active: bool
    official_url: str | None = None
    source: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
