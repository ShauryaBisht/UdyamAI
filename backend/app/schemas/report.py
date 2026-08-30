from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class ReportResponse(BaseModel):
    id: UUID
    analysis_run_id: UUID
    user_id: UUID
    title: str | None = None
    language: str | None = None
    report_data: dict[str, Any] | None = None
    report_file_path: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
