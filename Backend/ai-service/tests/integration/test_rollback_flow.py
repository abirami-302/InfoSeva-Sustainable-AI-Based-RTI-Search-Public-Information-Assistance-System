import pytest
from unittest.mock import patch, MagicMock
from app.services.upload_service import upload_pdf


@pytest.mark.integration
@pytest.mark.asyncio
@patch("app.services.upload_service.validate_pdf")
@patch("app.services.upload_service.validate_file_size")
@patch("app.services.upload_service.save_temp_file")
@patch("app.services.upload_service.extract_text_from_pdf")
@patch("app.services.upload_service.create_document")
@patch("app.services.upload_service.embed_document")
@patch("app.services.upload_service.delete_document")
@patch("app.services.upload_service.delete_document_embeddings")
@patch("app.services.upload_service.delete_temp_file")
async def test_upload_rollback_workflow_on_embedding_failure(
    mock_delete_temp,
    mock_delete_embed,
    mock_delete_doc,
    mock_embed_doc,
    mock_create_doc,
    mock_extract_text,
    mock_save_temp,
    mock_val_size,
    mock_val_pdf
):
    mock_save_temp.return_value = "/tmp/mock_file.pdf"
    mock_extract_text.return_value = "Sample text"
    mock_create_doc.return_value = MagicMock(documentId="doc_rollback_123")
    
    # Simulate embedding failure
    mock_embed_doc.side_effect = RuntimeError("ChromaDB Embedding Error")

    mock_file = MagicMock()
    result = await upload_pdf(
        file_obj=mock_file,
        filename="pm_kisan.pdf",
        file_size=1024,
        title="PM Kisan",
        department="Agriculture",
        document_type="Guidelines",
        document_date="2025-01-01"
    )

    assert result.success is False
    assert result.rollbackAttempted is True
    # Verify compensating rollback invocations
    mock_delete_doc.assert_called_once()
    mock_delete_temp.assert_called_once_with("/tmp/mock_file.pdf")
