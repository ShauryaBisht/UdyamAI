from datetime import datetime
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class DataSource(SQLModel, table=True):
    __tablename__ = "data_sources"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str | None = Field(default=None)
    organization: str | None = Field(default=None)
    url: str | None = Field(default=None)
    dataset_name: str | None = Field(default=None)
    geographic_level: str | None = Field(default=None)
    license: str | None = Field(default=None)

    last_updated_at: datetime | None = Field(default=None)
    last_verified_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
