from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON

class Report(SQLModel, table=True):
    __tablename__ = "reports"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    analysis_run_id: UUID = Field(foreign_key="analysis_runs.id", nullable=False)
    user_id: UUID = Field(foreign_key="profiles.id", nullable=False)

    title: Optional[str] = Field(default=None)
    language: Optional[str] = Field(default=None)
    report_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    report_file_path: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    analysis_run: "AnalysisRun" = Relationship(back_populates="reports")
    user: "Profile" = Relationship(back_populates="reports")
