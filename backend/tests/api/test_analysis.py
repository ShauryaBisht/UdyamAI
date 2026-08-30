from datetime import datetime
from unittest.mock import patch
from uuid import uuid4

from app.models.analysis import AnalysisRun

dummy_run = AnalysisRun(
    id=uuid4(),
    user_id=uuid4(),
    location_id=uuid4(),
    business_category_id=uuid4(),
    available_capital=50000.0,
    status="pending",
    created_at=datetime.utcnow(),
)


def test_create_analysis(client):
    payload = {
        "user_id": str(dummy_run.user_id),
        "location_id": str(dummy_run.location_id),
        "business_category_id": str(dummy_run.business_category_id),
        "available_capital": 50000.0,
    }
    with patch(
        "app.api.routes.analysis.AnalysisService.create_analysis_run", return_value=dummy_run
    ):
        response = client.post("/analysis", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["id"] == str(dummy_run.id)
        assert data["status"] == "pending"


def test_get_analysis_success(client):
    with patch("app.api.routes.analysis.AnalysisService.get_analysis_run", return_value=dummy_run):
        response = client.get(f"/analysis/{dummy_run.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(dummy_run.id)
        assert data["available_capital"] == 50000.0


def test_get_analysis_not_found(client):
    non_existent_id = uuid4()
    with patch("app.api.routes.analysis.AnalysisService.get_analysis_run", return_value=None):
        response = client.get(f"/analysis/{non_existent_id}")
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"]
