from datetime import datetime
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.ai import Conversation
    from app.models.analysis import AnalysisRun
    from app.models.location import Village
    from app.models.report import Report


class Profile(SQLModel, table=True):
    __tablename__ = "profiles"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    auth_user_id: UUID = Field(unique=True, index=True, nullable=False)
    name: str | None = Field(default=None)
    preferred_language: str | None = Field(default=None)
    location_id: UUID | None = Field(default=None, foreign_key="villages.id", nullable=True)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    location: Optional["Village"] = Relationship(back_populates="profiles")
    analysis_runs: list["AnalysisRun"] = Relationship(back_populates="profile")
    conversations: list["Conversation"] = Relationship(back_populates="user")
    reports: list["Report"] = Relationship(back_populates="user")
