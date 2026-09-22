import json
import sqlite3
from datetime import datetime, timezone
from uuid import uuid4

import pytest
from fastapi import Depends
from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

from app.api.deps import get_current_profile, get_current_user
from app.database import get_session
from app.main import app
from app.models import (  # noqa: F401
    agriculture,
    ai,
    analysis,
    budget,
    business,
    cash_flow,
    credit,
    debt,
    economic,
    expenses,
    finance,
    infrastructure,
    livestock,
    location,
    market,
    provenance,
    rag,
    report,
    savings,
    scheme,
    system,
    user,
    weather,
)
from app.models.analysis import AnalysisRun
from app.models.location import District, Taluka, Village
from app.models.user import Profile
from app.schemas.feasibility import AnalysisStatusResponse
from app.services.auth_service import AuthUser

# Register sqlite3 adapter for list serialization in SQLite in-memory test databases
sqlite3.register_adapter(list, json.dumps)

# Fixed identities used by the shared auth overrides below. Tests that build
# user-owned rows should reuse these ids so ownership checks line up.
TEST_AUTH_USER_ID = uuid4()
TEST_PROFILE_ID = uuid4()


def _fake_auth_user() -> AuthUser:
    return AuthUser(sub=str(TEST_AUTH_USER_ID), phone="+919999999999")


def _fake_auth_profile(session: Session = Depends(get_session)) -> Profile:
    p = session.exec(select(Profile).where(Profile.auth_user_id == TEST_AUTH_USER_ID)).first()
    if not p:
        p = Profile(
            id=TEST_PROFILE_ID,
            auth_user_id=TEST_AUTH_USER_ID,
            name="Test User",
            phone="+919999999999",
        )
        session.add(p)
        session.commit()
    return p


@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Enable FK enforcement only on this shared engine — not globally, so that
    # isolated per-test engines (which use mock location IDs) remain unaffected.
    @event.listens_for(engine, "connect")
    def _fk_pragma(dbapi_conn, _record):
        if hasattr(dbapi_conn, "execute"):
            try:
                dbapi_conn.execute("PRAGMA foreign_keys=ON;")
            except Exception:
                pass

    SQLModel.metadata.create_all(engine)
    return engine


@pytest.fixture(scope="function", autouse=True)
def _supabase_auth_overrides(test_engine):
    """Run route tests as an authenticated Supabase user and test database.

    Protected routers resolve identity through ``get_current_user`` /
    ``get_current_profile``; overriding them here keeps pre-auth tests
    green. Tests that specifically exercise auth failures should clear
    ``app.dependency_overrides`` for their own assertions.
    """

    def _get_test_session():
        with Session(test_engine) as session:
            yield session

    app.dependency_overrides[get_current_user] = _fake_auth_user
    app.dependency_overrides[get_current_profile] = _fake_auth_profile
    app.dependency_overrides[get_session] = _get_test_session
    yield
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture(scope="function")
def dummy_run():
    """Shared fixture for an AnalysisRun instance (owned by the test user)."""
    return AnalysisRun(
        id=uuid4(),
        user_id=TEST_PROFILE_ID,
        location_id=uuid4(),
        business_category_id=uuid4(),
        available_capital=50000.0,
        status="created",
        created_at=datetime.now(timezone.utc),
    )


@pytest.fixture(scope="function")
def dummy_status(dummy_run):
    """Shared fixture for an AnalysisStatusResponse instance."""
    return AnalysisStatusResponse(
        id=dummy_run.id,
        analysis_id=dummy_run.id,
        status="created",
        progress_percentage=10,
        current_step="created",
        created_at=datetime.now(timezone.utc),
    )


@pytest.fixture(scope="function")
def dummy_district():
    """Shared fixture for a District instance."""
    return District(id=uuid4(), name="Pune", state="Maharashtra", lgd_code="123")


@pytest.fixture(scope="function")
def dummy_taluka(dummy_district):
    """Shared fixture for a Taluka instance."""
    return Taluka(id=uuid4(), name="Haveli", district_id=dummy_district.id, lgd_code="456")


@pytest.fixture(scope="function")
def dummy_village(dummy_district, dummy_taluka):
    """Shared fixture for a Village instance."""
    return Village(
        id=uuid4(),
        name="Khed",
        district_id=dummy_district.id,
        taluka_id=dummy_taluka.id,
        lgd_code="789",
    )
