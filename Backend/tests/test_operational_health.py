from fastapi.testclient import TestClient
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError

from Backend.dependencias import get_db
from Backend.main import app


def test_health_endpoint_does_not_depend_on_database():
    response = TestClient(app).get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_cors_is_restricted_to_explicit_local_origins():
    cors_middleware = next(
        middleware
        for middleware in app.user_middleware
        if middleware.cls is CORSMiddleware
    )

    assert cors_middleware.kwargs["allow_origins"] == [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    assert cors_middleware.kwargs["allow_credentials"] is True


def test_readiness_returns_service_unavailable_when_database_fails(monkeypatch):
    class UnavailableDatabase:
        def execute(self, statement):
            raise SQLAlchemyError("database unavailable")

    monkeypatch.setitem(
        app.dependency_overrides,
        get_db,
        lambda: UnavailableDatabase(),
    )
    response = TestClient(app).get("/ready")

    assert response.status_code == 503
    assert response.json() == {"detail": "database unavailable"}


def test_readiness_succeeds_when_database_query_succeeds(monkeypatch):
    class AvailableDatabase:
        def execute(self, statement):
            return None

    monkeypatch.setitem(
        app.dependency_overrides,
        get_db,
        lambda: AvailableDatabase(),
    )
    response = TestClient(app).get("/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ready"}
