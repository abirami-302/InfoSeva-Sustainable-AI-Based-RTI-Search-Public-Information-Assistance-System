import pytest
from unittest.mock import patch
from app.services.summary_service import summarize_document
from app.models.request_models import SummarizeRequest
from app.models.document_model import DocumentModel


@pytest.mark.integration
@pytest.mark.asyncio
@patch("app.services.summary_service.get_document")
@patch("app.services.summary_service.GeminiSummarizerClient.generate_summary")
@patch("app.services.summary_service.update_document")
async def test_summary_workflow_using_mongodb_full_doc(mock_update, mock_gemini, mock_get_doc):
    mock_get_doc.return_value = DocumentModel(
        documentId="doc_summary_123",
        title="PM Kisan Operational Guidelines",
        department="Ministry of Agriculture",
        documentType="Scheme Guidelines"
    )
    mock_gemini.return_value = "Detailed summary preserving PM Kisan facts."

    req = SummarizeRequest(documentId="doc_summary_123")
    res = await summarize_document(req)

    assert res.summary == "Detailed summary preserving PM Kisan facts."
    mock_get_doc.assert_called_once_with("doc_summary_123")
    mock_gemini.assert_called_once()
    mock_update.assert_called_once()
