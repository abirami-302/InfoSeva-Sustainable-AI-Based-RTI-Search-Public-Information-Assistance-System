import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.models.response_models import SummaryResponse

client = TestClient(app)


@pytest.mark.api
@patch("app.api.summarize.summarize_document")
def test_summarize_endpoint_success(mock_summarize):
    mock_summarize.return_value = SummaryResponse(summary="Clean document summary.")

    payload = {"documentId": "doc_123"}
    response = client.post("/api/v1/summarize", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["summary"] == "Clean document summary."


@pytest.mark.api
def test_summarize_endpoint_method_not_allowed():
    response = client.get("/api/v1/summarize")
    assert response.status_code == 405
