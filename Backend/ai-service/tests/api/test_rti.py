import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.services.rti_service import RTIProcessResponse

client = TestClient(app)


@pytest.mark.api
@patch("app.api.rti.process_rti_request")
def test_rti_process_endpoint_success(mock_process_rti):
    mock_process_rti.return_value = RTIProcessResponse(
        success=True,
        shouldFileRTI=False,
        reason="Information available",
        confidence=0.88,
        department="Agriculture",
        executionTimeMs=12.0
    )

    payload = {
        "topic": "PM Kisan eligibility",
        "department": "Agriculture",
        "applicantName": "Rajesh Kumar"
    }
    response = client.post("/api/v1/rti/process", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert res_data["shouldFileRTI"] is False


@pytest.mark.api
def test_rti_process_endpoint_validation_error():
    payload = {}  # Missing topic
    response = client.post("/api/v1/rti/process", json=payload)
    assert response.status_code == 422


@pytest.mark.api
def test_rti_process_endpoint_method_not_allowed():
    response = client.get("/api/v1/rti/process")
    assert response.status_code == 405
