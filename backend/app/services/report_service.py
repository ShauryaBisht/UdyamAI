from uuid import UUID

from sqlmodel import Session

from app.models.report import Report


class ReportService:
    @staticmethod
    def get_report(db: Session, report_id: UUID) -> Report | None:
        return db.get(Report, report_id)
