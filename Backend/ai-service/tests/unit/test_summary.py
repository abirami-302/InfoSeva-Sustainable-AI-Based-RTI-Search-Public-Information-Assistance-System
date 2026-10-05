import pytest
from unittest.mock import patch, AsyncMock
from app.services.summary_service import summarize_document
from app.models.request_models import SummarizeRequest
from app.models.document_model import DocumentModel


@pytest.mark.unit
@pytest.mark.asyncio
@patch("app.services.summary_service.get_document")
@patch("app.services.summary_service.GeminiSummarizerClient.generate_summary")
@patch("app.services.summary_service.update_document")
async def test_summarize_document_by_id_success(mock_update_doc, mock_gemini, mock_get_doc):
    mock_get_doc.return_value = DocumentModel(
        documentId="doc_test_123",
        title="PM Kisan Guidelines",
        department="Agriculture",
        documentType="Guidelines"
    )
    mock_gemini.return_value = "This is a clean summary of PM Kisan scheme."

    req = SummarizeRequest(documentId="doc_test_123")
    res = await summarize_document(req)

    assert res.summary == "This is a clean summary of PM Kisan scheme."
    mock_get_doc.assert_called_once_with("doc_test_123")
    mock_gemini.assert_called_once()
    mock_update_doc.assert_called_once()


@pytest.mark.unit
@pytest.mark.asyncio
@patch("app.services.summary_service.GeminiSummarizerClient.generate_summary")
async def test_summarize_raw_text_success(mock_gemini, sample_document_text):
    mock_gemini.return_value = "Summary of raw PM Kisan text."

    req = SummarizeRequest(text=sample_document_text)
    res = await summarize_document(req)

    assert res.summary == "Summary of raw PM Kisan text."
    mock_gemini.assert_called_once()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_summarize_document_missing_payload():
    req = SummarizeRequest()
    with pytest.raises(ValueError) as exc_info:
        await summarize_document(req)
    assert "Either documentId or raw text must be provided" in str(exc_info.value)


@pytest.mark.unit
@pytest.mark.asyncio
@patch("app.services.summary_service.get_document")
async def test_summarize_document_not_found(mock_get_doc):
    mock_get_doc.return_value = None

    req = SummarizeRequest(documentId="nonexistent_id")
    with pytest.raises(ValueError) as exc_info:
        await summarize_document(req)
    assert "was not found" in str(exc_info.value)
