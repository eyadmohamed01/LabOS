from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_openapi_contains_health() -> None:
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert "/api/health" in response.json()["paths"]


def test_docs_page() -> None:
    response = client.get("/docs")
    assert response.status_code == 200
