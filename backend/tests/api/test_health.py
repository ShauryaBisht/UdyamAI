from unittest.mock import patch

def test_health_endpoint_success(client):
    """Test health check success when DB is connected."""
    with patch("app.api.routes.health.verify_db_connection", return_value=True):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "connected"

def test_health_endpoint_failure(client):
    """Test health check failure when DB is offline."""
    with patch("app.api.routes.health.verify_db_connection", return_value=False):
        response = client.get("/health")
        assert response.status_code == 503
        data = response.json()
        assert data["detail"]["status"] == "unhealthy"
        assert data["detail"]["database"] == "disconnected"
