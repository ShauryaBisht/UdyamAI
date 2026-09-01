import json
import sqlite3
from datetime import datetime, timezone
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.analysis import AnalysisRun
from app.models.location import District, Taluka, Village
from app.schemas.feasibility import AnalysisStatusResponse

# Register sqlite3 adapter for list serialization in SQLite in-memory test databases
sqlite3.register_adapter(list, json.dumps)


@pytest.fixture(scope="function")
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture(scope="function")
def dummy_run():
    """Shared fixture for an AnalysisRun instance."""
    return AnalysisRun(
        id=uuid4(),
        user_id=uuid4(),
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
