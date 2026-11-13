from fastapi.testclient import TestClient

from pitaya.platform.web.app import create_app


def test_api_endpoints_with_snapshot() -> None:
    client = TestClient(create_app())
    assert client.get("/v1/kpis").status_code == 200
    assert client.get("/v1/roi").status_code == 200
    assert client.get("/v1/models").status_code == 200
    assert client.get("/v1/attribution?model=shapley").status_code == 200
    assert client.post("/v1/ab-test", json={}).status_code == 200
    rec = client.post(
        "/v1/recommendations",
        json={"total_budget": 5000, "min_share": 0.05, "max_share": 0.5},
        headers={"Idempotency-Key": "test-key-1"},
    )
    assert rec.status_code == 200
    assert client.get("/v1/recommendations").status_code == 200
