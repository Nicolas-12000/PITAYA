from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from pitaya.kernel.errors import SnapshotNotFoundError
from pitaya.platform.web.app import create_app


def test_kpis_returns_503_without_snapshot() -> None:
    client = TestClient(create_app())
    with patch(
        "pitaya.orchestration.workflows.kpis.get_kpis_workflow",
        side_effect=SnapshotNotFoundError("missing"),
    ):
        response = client.get("/v1/kpis")
    assert response.status_code == 503


def test_recommendations_conflict_409() -> None:
    client = TestClient(create_app())
    headers = {"Idempotency-Key": "conflict-key"}
    body = {"total_budget": 1000, "min_share": 0.0, "max_share": 1.0}
    first = client.post("/v1/recommendations", json=body, headers=headers)
    if first.status_code != 200:
        pytest.skip("snapshot required for recommendations")
    body["total_budget"] = 2000
    second = client.post("/v1/recommendations", json=body, headers=headers)
    assert second.status_code == 409
