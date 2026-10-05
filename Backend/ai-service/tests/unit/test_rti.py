import pytest
from unittest.mock import patch, MagicMock

from app.services.rti_service import process_rti_request, RTIServiceRequest
from app.models.response_models import SearchResponse, SearchResult, Citation


@pytest.mark.unit
@patch("app.services.rti_service.search_documents")
def test_process_rti_high_confidence_no_gemini(mock_search_docs, sample_search_results, sample_citations):
    # High confidence score (>= 0.77)
    high_score_result = SearchResult(
        documentId="doc_test_123",
        title="PM Kisan Guidelines",
        department="Agriculture",
        date="2025-01-01",
        score=0.88,
        snippet="Complete guidelines for PM Kisan scheme."
    )
    mock_search_docs.return_value = SearchResponse(
        success=True,
        message="Found",
        query="PM Kisan benefits",
        totalResults=1,
        results=[high_score_result],
        citations=sample_citations,
        executionTimeMs=10.0
    )

    req = RTIServiceRequest(
        informationRequested="What are the benefits of PM Kisan scheme?",
        applicantName="Rajesh Kumar",
        applicantAddress="New Delhi, India"
    )

    res = process_rti_request(req)

    assert res.success is True
    assert res.shouldFileRTI is False
    assert "Sufficient information was found" in res.reason
    assert res.draft is None
    mock_search_docs.assert_called_once()


@pytest.mark.unit
@patch("app.services.rti_service.search_documents")
@patch("app.services.rti_service.GeminiRTIClient.generate_rti_draft")
def test_process_rti_low_confidence_generates_draft(mock_gemini_draft, mock_search_docs):
    mock_search_docs.return_value = SearchResponse(
        success=True,
        message="No docs found",
        query="Obscure local road construction details",
        totalResults=0,
        results=[],
        citations=[],
        executionTimeMs=10.0
    )
    mock_gemini_draft.return_value = "FORMAL RTI APPLICATION CONTENT"

    req = RTIServiceRequest(
        informationRequested="Road construction budget details for Ward 12",
        applicantName="Rajesh Kumar",
        applicantAddress="New Delhi, India",
        applicantEmail="rajesh@example.com",
        applicantPhone="9876543210",
        department="Public Works Department"
    )

    res = process_rti_request(req)

    assert res.success is True
    assert res.shouldFileRTI is True
    assert res.draft is not None
    assert res.draft.applicantName == "Rajesh Kumar"
    assert res.draft.applicantEmail == "rajesh@example.com"
    assert res.draft.publicAuthority == "Public Works Department"
    mock_search_docs.assert_called_once()
    mock_gemini_draft.assert_called_once()
