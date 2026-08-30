from datetime import datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID, uuid4

from sqlalchemy import JSON, Column
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.analysis import AnalysisRun
    from app.models.user import Profile


class Report(SQLModel, table=True):
    __tablename__ = "reports"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    analysis_run_id: UUID = Field(foreign_key="analysis_runs.id", nullable=False)
    user_id: UUID = Field(foreign_key="profiles.id", nullable=False)

    title: str | None = Field(default=None)
    language: str | None = Field(default=None)
    report_data: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    report_file_path: str | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    analysis_run: "AnalysisRun" = Relationship(back_populates="reports")
    user: "Profile" = Relationship(back_populates="reports")
