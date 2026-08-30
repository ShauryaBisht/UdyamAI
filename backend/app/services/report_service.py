from sqlmodel import Session
from typing import Optional
from uuid import UUID
from app.models.report import Report

class ReportService:
    @staticmethod
    def get_report(db: Session, report_id: UUID) -> Optional[Report]:
        return db.get(Report, report_id)
