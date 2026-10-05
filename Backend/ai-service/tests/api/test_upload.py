import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app
from app.services.upload_service import UploadResult

client = TestClient(app)


@pytest.mark.api
@patch("app.api.upload.upload_pdf")
def test_upload_pdf_success(mock_upload_pdf):
    mock_upload_pdf.return_value = UploadResult(
        success=True,
        documentId="doc_test_123",
        title="PM Kisan Guidelines",
        department="Agriculture",
        chunksProcessed=4,
        message="Upload success"
    )

    pdf_content = b"%PDF-1.4 Mock PDF content"
    files = {"file": ("test.pdf", pdf_content, "application/pdf")}
    data = {
        "title": "PM Kisan Guidelines",
        "department": "Agriculture",
        "documentType": "Guidelines",
        "documentDate": "2025-01-01"
    }

    response = client.post("/api/v1/upload", files=files, data=data)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert res_data["documentId"] == "doc_test_123"


@pytest.mark.api
def test_upload_pdf_missing_form_data():
    pdf_content = b"%PDF-1.4 Mock PDF content"
    files = {"file": ("test.pdf", pdf_content, "application/pdf")}

    response = client.post("/api/v1/upload", files=files)
    assert response.status_code == 422  # Validation Error


@pytest.mark.api
def test_upload_pdf_method_not_allowed():
    response = client.get("/api/v1/upload")
    assert response.status_code == 405
