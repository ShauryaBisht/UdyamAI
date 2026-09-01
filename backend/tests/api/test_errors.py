from fastapi.testclient import TestClient

from app.utils.errors import AppException, _sanitize_message


def test_sanitize_message():
    raw_secret = "Database failed with password=super_secret_pass and key=123"
    sanitized = _sanitize_message(raw_secret)
    assert "super_secret_pass" not in sanitized
    assert "123" not in sanitized
    assert "[REDACTED]" in sanitized


def test_app_exception_structure(client):
    from fastapi import APIRouter

    from app.main import app

    test_router = APIRouter()

    @test_router.get("/test-structured-error")
    def trigger_error():
        raise AppException(
            status_code=404,
            code="LOCATION_NOT_FOUND",
            message="The selected village could not be found.",
        )

    app.include_router(test_router)

    response = client.get("/test-structured-error")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "LOCATION_NOT_FOUND"
    assert data["error"]["message"] == "The selected village could not be found."


def test_db_error_sanitization():
    from fastapi import APIRouter

    from app.main import app

    test_router = APIRouter()

    @test_router.get("/test-db-error")
    def trigger_db_error():
        raise Exception("psycopg2.OperationalError: password=secret123 failed to connect to host")

    app.include_router(test_router)

    safe_client = TestClient(app, raise_server_exceptions=False)
    response = safe_client.get("/test-db-error")
    assert response.status_code == 500
    data = response.json()
    assert data["error"]["code"] == "DATABASE_ERROR"
    assert "secret123" not in str(data)
    assert data["error"]["message"] == "A database operation failed."
