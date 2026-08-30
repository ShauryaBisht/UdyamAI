from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlmodel import Session, select

from app.models.analysis import AnalysisRun
from app.models.business import BusinessCategory
from app.models.location import Village
from app.schemas.feasibility import AnalysisRunCreate, AnalysisStatusResponse


class AnalysisService:
    @staticmethod
    def verify_location(db: Session, location_ref: UUID | str | None) -> UUID | None:
        if location_ref is None:
            return None

        village: Village | None = None
        if isinstance(location_ref, UUID):
            village = db.get(Village, location_ref)
        else:
            # Try UUID string parsing first
            try:
                parsed_uuid = UUID(str(location_ref))
                village = db.get(Village, parsed_uuid)
            except ValueError:
                pass

            if not village:
                statement = select(Village).where(Village.lgd_code == str(location_ref))
                village = db.exec(statement).first()

        if not village:
            raise HTTPException(
                status_code=404,
                detail=f"Location with identifier '{location_ref}' not found",
            )
        return village.id

    @staticmethod
    def verify_business_category(db: Session, category_ref: UUID | str | None) -> UUID | None:
        if category_ref is None:
            return None

        category: BusinessCategory | None = None
        if isinstance(category_ref, UUID):
            category = db.get(BusinessCategory, category_ref)
        else:
            try:
                parsed_uuid = UUID(str(category_ref))
                category = db.get(BusinessCategory, parsed_uuid)
            except ValueError:
                pass

            if not category:
                statement = select(BusinessCategory).where(
                    BusinessCategory.name == str(category_ref)
                )
                category = db.exec(statement).first()

        if not category:
            raise HTTPException(
                status_code=404,
                detail=f"Business category with identifier '{category_ref}' not found",
            )
        return category.id

    @staticmethod
    def create_analysis_run(db: Session, run_data: AnalysisRunCreate) -> AnalysisRun:
        # Step 1: Input validated via AnalysisRunCreate schema
        # Step 2: Verify location
        raw_location = run_data.location_id or run_data.village_id
        resolved_location_id = AnalysisService.verify_location(db, raw_location)

        # Step 3: Verify business category
        resolved_category_id = AnalysisService.verify_business_category(
            db, run_data.business_category_id
        )

        # Step 4: Create AnalysisRun
        user_id = run_data.user_id or uuid4()
        db_run = AnalysisRun(
            user_id=user_id,
            location_id=resolved_location_id,
            business_category_id=resolved_category_id,
            available_capital=run_data.available_capital,
            status="created",
        )
        db.add(db_run)
        db.commit()
        db.refresh(db_run)
        return db_run

    @staticmethod
    def get_analysis_run(db: Session, run_id: UUID) -> AnalysisRun | None:
        return db.get(AnalysisRun, run_id)

    @staticmethod
    def get_analysis_run_status(db: Session, run_id: UUID) -> AnalysisStatusResponse | None:
        db_run = db.get(AnalysisRun, run_id)
        if not db_run:
            return None

        progress = 10
        step = "created"

        if db_run.status == "pending":
            progress = 25
            step = "queued"
        elif db_run.status == "running":
            progress = 65
            step = "evaluating_rules"
        elif db_run.status == "completed":
            progress = 100
            step = "completed"
        elif db_run.status == "failed":
            progress = 0
            step = "failed"

        return AnalysisStatusResponse(
            id=db_run.id,
            analysis_id=db_run.id,
            status=db_run.status,
            progress_percentage=progress,
            current_step=step,
            created_at=db_run.created_at,
            completed_at=db_run.completed_at,
            error_message=None,
        )
