"""Pydantic schemas for User profile and settings operations."""

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, field_validator

# ---------------------------------------------------------------------------
# Allowed enum values for settings fields
# ---------------------------------------------------------------------------

ALLOWED_THEMES = ("light", "dark", "system")
ALLOWED_DATE_FORMATS = ("DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD")
ALLOWED_DEFAULT_VIEWS = ("dashboard", "cashflow", "analysis", "finance", "settings")
ALLOWED_LANGUAGES = (
    "en",
    "hi",
    "mr",
    "gu",
    "ta",
    "te",
    "kn",
    "ml",
    "pa",
    "bn",
    "or",
    "as",
)


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


class UserSettingsUpdateRequest(BaseModel):
    """Validated settings update payload.

    Enum-constrained fields reject unknown values before they reach the DB.
    """

    currency: str | None = None
    date_format: Literal["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] | None = None
    notification_email: bool | None = None
    notification_sms: bool | None = None
    notification_push: bool | None = None
    language: str | None = None
    theme: Literal["light", "dark", "system"] | None = None
    default_view: Literal["dashboard", "cashflow", "analysis", "finance", "settings"] | None = None
    auto_backup: bool | None = None

    @field_validator("language")
    @classmethod
    def _validate_language(cls, v: str | None) -> str | None:
        if v is not None and v not in ALLOWED_LANGUAGES:
            raise ValueError(f"Unsupported language '{v}'. Allowed values: {ALLOWED_LANGUAGES}")
        return v


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
    date_format: Literal["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] | None = None
    notification_email: bool | None = None
    notification_sms: bool | None = None
    notification_push: bool | None = None
    language: str | None = None
    theme: Literal["light", "dark", "system"] | None = None
    default_view: Literal["dashboard", "cashflow", "analysis", "finance", "settings"] | None = None
    auto_backup: bool | None = None
    settings: UserSettingsUpdateRequest | dict[str, Any] | None = None

    @field_validator("language", "preferred_language")
    @classmethod
    def _validate_language(cls, v: str | None) -> str | None:
        if v is not None and v not in ALLOWED_LANGUAGES:
            raise ValueError(f"Unsupported language '{v}'. Allowed values: {ALLOWED_LANGUAGES}")
        return v
