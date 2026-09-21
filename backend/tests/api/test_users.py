"""Tests for User account routes (/users/me)."""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_current_profile, get_current_user
from app.main import app
from app.models.user import Profile
from app.services.auth_service import AuthUser


@pytest.fixture
def test_user_and_profile(client: TestClient):
    """Setup a dedicated user and profile in the test database session."""
    auth_user_id = uuid4()
    profile_id = uuid4()

    auth_user = AuthUser(
        sub=str(auth_user_id),
        email="entrepreneur@udyamai.org",
        phone="+919876543210",
        role="authenticated",
    )
    profile = Profile(
        id=profile_id,
        auth_user_id=auth_user_id,
        name="Ramesh Patil",
        email="entrepreneur@udyamai.org",
        phone="+919876543210",
        business_name="Patil Agro Services",
        business_type="agriculture",
        preferred_language="mr",
    )

    # Override dependencies for this test
    app.dependency_overrides[get_current_user] = lambda: auth_user
    app.dependency_overrides[get_current_profile] = lambda: profile

    yield auth_user, profile

    app.dependency_overrides.clear()


def test_users_me_unauthenticated(client: TestClient):
    """Unauthenticated call to /api/v1/users/me should be rejected with 401."""
    app.dependency_overrides.clear()
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401


def test_get_users_me_authenticated(client: TestClient, test_user_and_profile):
    """GET /users/me and /api/v1/users/me return profile and initialized settings."""
    _, profile = test_user_and_profile

    response = client.get("/api/v1/users/me")
    assert response.status_code == 200
    data = response.json()

    assert data["id"] == str(profile.id)
    assert data["name"] == "Ramesh Patil"
    assert data["email"] == "entrepreneur@udyamai.org"
    assert data["business_name"] == "Patil Agro Services"
    assert data["business_type"] == "agriculture"
    assert data["preferred_language"] == "mr"
    assert "settings" in data
    assert data["settings"]["currency"] == "INR"


def test_patch_users_me(client: TestClient, test_user_and_profile):
    """PATCH /users/me updates both profile fields and settings fields."""
    _, profile = test_user_and_profile

    update_payload = {
        "name": "Ramesh S. Patil",
        "business_name": "Patil Smart Agro",
        "business_type": "food_processing",
        "preferred_language": "hi",
        "theme": "dark",
        "notification_email": False,
        "notification_sms": True,
        "default_view": "cashflow",
    }

    response = client.patch("/api/v1/users/me", json=update_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["name"] == "Ramesh S. Patil"
    assert data["business_name"] == "Patil Smart Agro"
    assert data["business_type"] == "food_processing"
    assert data["preferred_language"] == "hi"

    settings_data = data["settings"]
    assert settings_data["theme"] == "dark"
    assert settings_data["notification_email"] is False
    assert settings_data["notification_sms"] is True
    assert settings_data["default_view"] == "cashflow"


def test_delete_users_me(client: TestClient, test_user_and_profile):
    """DELETE /users/me deletes the user profile and associated data."""
    response = client.delete("/api/v1/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "deleted successfully" in data["message"]
