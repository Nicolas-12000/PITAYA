from fastapi.testclient import TestClient

from pitaya.platform.web.app import create_app


def test_health_endpoint() -> None:
    client = TestClient(create_app())
    response = client.get("/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_status_without_snapshot() -> None:
    client = TestClient(create_app())
    response = client.get("/v1/status")
    assert response.status_code == 200
    body = response.json()
    assert "storage_mode" in body
    assert body["snapshot"]["loaded"] is False
