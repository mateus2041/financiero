from unittest.mock import Mock

from fastapi.testclient import TestClient

from Backend.main import app, get_db


def test_liveness_does_not_depend_on_database():
    response = TestClient(app).get("/health/live")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_readiness_checks_database(monkeypatch):
    database = Mock()
    monkeypatch.setitem(app.dependency_overrides, get_db, lambda: database)

    response = TestClient(app).get("/health/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}
    database.execute.assert_called_once()
