import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.services.search_service import SearchResponse
from app.models.response_models import SearchResult, Citation

client = TestClient(app)


@pytest.mark.api
@patch("app.api.search.search_with_filters")
def test_search_endpoint_success(mock_search_service):
    mock_search_service.return_value = SearchResponse(
        success=True,
        message="Search completed",
        query="PM Kisan benefits",
        totalResults=1,
        results=[
            SearchResult(
                documentId="doc_123",
                title="PM Kisan Guidelines",
                department="Agriculture",
                date="2025-01-01",
                score=0.88,
                snippet="PM Kisan provides Rs 6000."
            )
        ],
        citations=[
            Citation(
                documentId="doc_123",
                title="PM Kisan Guidelines",
                department="Agriculture",
                date="2025-01-01"
            )
        ],
        executionTimeMs=12.5
    )

    payload = {"query": "PM Kisan benefits", "topK": 5}
    response = client.post("/api/v1/search", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert res_data["totalResults"] == 1
    assert len(res_data["citations"]) == 1


@pytest.mark.api
def test_search_endpoint_validation_error():
    payload = {}  # Missing query
    response = client.post("/api/v1/search", json=payload)
    assert response.status_code == 422


@pytest.mark.api
def test_search_endpoint_method_not_allowed():
    response = client.get("/api/v1/search")
    assert response.status_code == 405
