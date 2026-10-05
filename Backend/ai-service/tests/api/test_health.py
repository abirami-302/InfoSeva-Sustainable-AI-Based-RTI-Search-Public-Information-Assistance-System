import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@pytest.mark.api
@patch("app.api.health.get_database")
@patch("app.api.health.get_chroma_client")
def test_health_check_healthy(mock_chroma, mock_mongo):
    mock_db = MagicMock()
    mock_db.command = MagicMock()
    mock_mongo.return_value = mock_db

    mock_client = MagicMock()
    mock_client.heartbeat = MagicMock()
    mock_chroma.return_value = mock_client

    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["services"]["mongodb"] == "healthy"
    assert data["services"]["chromadb"] == "healthy"


@pytest.mark.api
@patch("app.api.health.get_database")
@patch("app.api.health.get_chroma_client")
def test_health_check_mongo_unhealthy(mock_chroma, mock_mongo):
    mock_mongo.side_effect = RuntimeError("Mongo Connection Error")
    mock_client = MagicMock()
    mock_client.heartbeat = MagicMock()
    mock_chroma.return_value = mock_client

    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "degraded"
    assert data["services"]["mongodb"] == "unhealthy"


@pytest.mark.api
def test_health_check_method_not_allowed():
    response = client.post("/api/v1/health")
    assert response.status_code == 405
