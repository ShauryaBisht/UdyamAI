from uuid import UUID

from sqlmodel import Session

from app.models.analysis import AnalysisRun
from app.schemas.feasibility import AnalysisRunCreate


class AnalysisService:
    @staticmethod
    def create_analysis_run(db: Session, run_data: AnalysisRunCreate) -> AnalysisRun:
        db_run = AnalysisRun(
            user_id=run_data.user_id,
            location_id=run_data.location_id,
            business_category_id=run_data.business_category_id,
            available_capital=run_data.available_capital,
            status="pending",
        )
        db.add(db_run)
        db.commit()
        db.refresh(db_run)
        return db_run

    @staticmethod
    def get_analysis_run(db: Session, run_id: UUID) -> AnalysisRun | None:
        return db.get(AnalysisRun, run_id)
