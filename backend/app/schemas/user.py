"""Pydantic schemas for User profile and settings operations."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class UserSettingsResponse(BaseModel):
    id: UUID
    profile_id: UUID
    currency: str = "INR"
    date_format: str = "DD/MM/YYYY"
    notification_email: bool = True
    notification_sms: bool = False
    notification_push: bool = True
    language: str = "en"
    theme: str = "light"
    default_view: str = "dashboard"
    auto_backup: bool = True
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: UUID
    auth_user_id: UUID
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    business_name: str | None = None
    business_type: str | None = None
    preferred_language: str | None = "en"
    location_id: UUID | None = None
    created_at: datetime
    updated_at: datetime
    settings: UserSettingsResponse | None = None

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    # Profile fields (matching profile/page.tsx)
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    business_name: str | None = None
    business_type: str | None = None
    preferred_language: str | None = None
    location_id: UUID | None = None

    # Settings fields (matching settings/page.tsx - flat or nested)
    currency: str | None = None
    date_format: str | None = None
    notification_email: bool | None = None
    notification_sms: bool | None = None
    notification_push: bool | None = None
    language: str | None = None
    theme: str | None = None
    default_view: str | None = None
    auto_backup: bool | None = None
    settings: dict[str, Any] | None = None
