from typing import Optional
from datetime import datetime
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field

class DataSource(SQLModel, table=True):
    __tablename__ = "data_sources"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: Optional[str] = Field(default=None)
    organization: Optional[str] = Field(default=None)
    url: Optional[str] = Field(default=None)
    dataset_name: Optional[str] = Field(default=None)
    geographic_level: Optional[str] = Field(default=None)
    license: Optional[str] = Field(default=None)

    last_updated_at: Optional[datetime] = Field(default=None)
    last_verified_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
