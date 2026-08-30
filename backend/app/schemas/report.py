from pydantic import BaseModel
from uuid import UUID
from typing import Optional, Any, Dict
from datetime import datetime

class ReportResponse(BaseModel):
    id: UUID
    analysis_run_id: UUID
    user_id: UUID
    title: Optional[str] = None
    language: Optional[str] = None
    report_data: Optional[Dict[str, Any]] = None
    report_file_path: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
