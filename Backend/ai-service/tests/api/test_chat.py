import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.services.chat_service import ChatServiceResponse

client = TestClient(app)


@pytest.mark.api
@patch("app.api.chat.process_chat_message")
def test_chat_endpoint_success(mock_process_chat):
    mock_process_chat.return_value = ChatServiceResponse(
        success=True,
        conversationId="conv_123",
        title="PMAY Eligibility",
        message="Success",
        answer="PMAY is a housing scheme.",
        citations=[],
        retrievedDocumentsCount=1,
        executionTimeMs=15.2,
        timestamp="2026-08-05T21:00:00Z"
    )

    payload = {"message": "Tell me about PMAY"}
    response = client.post("/api/v1/chat", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert res_data["conversationId"] == "conv_123"


@pytest.mark.api
def test_chat_endpoint_validation_error():
    payload = {}  # Missing message
    response = client.post("/api/v1/chat", json=payload)
    assert response.status_code == 422


@pytest.mark.api
def test_chat_endpoint_method_not_allowed():
    response = client.get("/api/v1/chat")
    assert response.status_code == 405
