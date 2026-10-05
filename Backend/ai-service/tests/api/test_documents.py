import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.models.document_model import DocumentModel

client = TestClient(app)


@pytest.mark.api
@patch("app.api.document.get_all_documents")
def test_list_documents_endpoint_success(mock_get_all):
    mock_get_all.return_value = [
        DocumentModel(
            documentId="doc_123",
            title="PM Kisan Guidelines",
            department="Agriculture",
            documentType="Guidelines"
        )
    ]

    response = client.get("/api/v1/documents")
    assert response.status_code == 200
    res_data = response.json()
    assert len(res_data) == 1
    assert res_data[0]["documentId"] == "doc_123"


@pytest.mark.api
@patch("app.api.document.get_document")
def test_get_document_by_id_success(mock_get_doc):
    mock_get_doc.return_value = DocumentModel(
        documentId="doc_123",
        title="PM Kisan Guidelines",
        department="Agriculture",
        documentType="Guidelines"
    )

    response = client.get("/api/v1/documents/doc_123")
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["documentId"] == "doc_123"


@pytest.mark.api
@patch("app.api.document.get_document")
def test_get_document_by_id_not_found(mock_get_doc):
    mock_get_doc.return_value = None

    response = client.get("/api/v1/documents/nonexistent")
    assert response.status_code == 404


@pytest.mark.api
@patch("app.api.document.delete_document")
def test_delete_document_endpoint_success(mock_delete_doc):
    mock_delete_doc.return_value = True

    response = client.delete("/api/v1/documents/doc_123")
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True


@pytest.mark.api
@patch("app.api.document.delete_document")
def test_delete_document_endpoint_not_found(mock_delete_doc):
    mock_delete_doc.return_value = False

    response = client.delete("/api/v1/documents/nonexistent")
    assert response.status_code == 404
