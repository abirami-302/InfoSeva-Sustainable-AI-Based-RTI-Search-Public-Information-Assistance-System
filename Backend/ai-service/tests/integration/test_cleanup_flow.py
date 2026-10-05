import pytest
from unittest.mock import patch, MagicMock
from app.services.upload_service import upload_pdf


@pytest.mark.integration
@pytest.mark.asyncio
@patch("app.services.upload_service.validate_pdf")
@patch("app.services.upload_service.validate_file_size")
@patch("app.services.upload_service.save_temp_file")
@patch("app.services.upload_service.extract_text_from_pdf")
@patch("app.services.upload_service.delete_temp_file")
async def test_cleanup_workflow_always_removes_temp_file(
    mock_delete_temp,
    mock_extract_text,
    mock_save_temp,
    mock_val_size,
    mock_val_pdf
):
    mock_save_temp.return_value = "/tmp/temp_cleanup_test.pdf"
    mock_extract_text.side_effect = ValueError("Corrupted PDF text")

    mock_file = MagicMock()
    result = await upload_pdf(
        file_obj=mock_file,
        filename="corrupted.pdf",
        file_size=500,
        title="Corrupted Doc",
        department="General",
        document_type="Guidelines",
        document_date="2025-01-01"
    )

    assert result.success is False
    # Verify temp file deletion executed in finally block
    mock_delete_temp.assert_called_once_with("/tmp/temp_cleanup_test.pdf")
