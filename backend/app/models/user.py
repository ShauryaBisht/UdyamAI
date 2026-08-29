from typing import Optional, List
from datetime import datetime
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship

class Profile(SQLModel, table=True):
    __tablename__ = "profiles"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    auth_user_id: UUID = Field(unique=True, index=True, nullable=False)
    name: Optional[str] = Field(default=None)
    preferred_language: Optional[str] = Field(default=None)
    location_id: Optional[UUID] = Field(default=None, foreign_key="villages.id", nullable=True)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    location: Optional["Village"] = Relationship(back_populates="profiles")
    analysis_runs: List["AnalysisRun"] = Relationship(back_populates="profile")
    conversations: List["Conversation"] = Relationship(back_populates="user")
    reports: List["Report"] = Relationship(back_populates="user")
