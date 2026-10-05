import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from app.services.upload_service import upload_pdf, UploadResult


@pytest.mark.integration
@pytest.mark.asyncio
@patch("app.services.upload_service.validate_pdf")
@patch("app.services.upload_service.validate_file_size")
@patch("app.services.upload_service.save_temp_file")
@patch("app.services.upload_service.extract_text_from_pdf")
@patch("app.services.upload_service.create_document")
@patch("app.services.upload_service.embed_document")
@patch("app.services.upload_service.delete_temp_file")
async def test_upload_pdf_full_workflow_success(
    mock_delete_temp,
    mock_embed_doc,
    mock_create_doc,
    mock_extract_text,
    mock_save_temp,
    mock_val_size,
    mock_val_pdf
):
    mock_save_temp.return_value = "/tmp/mock_sample.pdf"
    mock_extract_text.return_value = "Extracted text content from PM Kisan PDF document."
    mock_create_doc.return_value = MagicMock(documentId="doc_test_123")
    mock_embed_doc.return_value = MagicMock(success=True, chunksProcessed=2)

    mock_file = MagicMock()
    result = await upload_pdf(
        file_obj=mock_file,
        filename="pm_kisan.pdf",
        file_size=1024,
        title="PM Kisan Guidelines",
        department="Agriculture",
        document_type="Guidelines",
        document_date="2025-01-01"
    )

    assert result.success is True
    assert result.chunksProcessed == 2

    # Verify execution order & call assertions
    mock_val_pdf.assert_called_once_with("pm_kisan.pdf")
    mock_val_size.assert_called_once_with(1024)
    mock_save_temp.assert_called_once()
    mock_extract_text.assert_called_once_with("/tmp/mock_sample.pdf")
    mock_create_doc.assert_called_once()
    mock_embed_doc.assert_called_once()
    mock_delete_temp.assert_called_once_with("/tmp/mock_sample.pdf")
