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

    @test_router.get("/test-non-db-error")
    def trigger_non_db_error():
        raise Exception("Invalid feedback received in sandbox handler")

    app.include_router(test_router)

    safe_client = TestClient(app, raise_server_exceptions=False)
    response = safe_client.get("/test-db-error")
    assert response.status_code == 500
    data = response.json()
    assert data["error"]["code"] == "DATABASE_ERROR"
    assert "secret123" not in str(data)
    assert data["error"]["message"] == "A database operation failed."

    non_db_resp = safe_client.get("/test-non-db-error")
    assert non_db_resp.status_code == 500
    non_db_data = non_db_resp.json()
    assert non_db_data["error"]["code"] == "INTERNAL_SERVER_ERROR"


def test_is_database_error_helper():
    from sqlalchemy.exc import OperationalError

    from app.utils.errors import _is_database_error

    assert _is_database_error(OperationalError("select 1", {}, Exception("conn fail")))
    assert _is_database_error(Exception("psycopg2.IntegrityError: duplicate key"))
    assert _is_database_error(Exception("Database connection timeout"))
    # False positives that contain 'db' as substring
    assert not _is_database_error(Exception("Invalid feedback submitted"))
    assert not _is_database_error(Exception("Sandbox execution failed"))
    assert not _is_database_error(Exception("Dashboard widget error"))
