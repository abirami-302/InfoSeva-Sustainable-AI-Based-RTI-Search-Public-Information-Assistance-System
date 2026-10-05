import pytest
from unittest.mock import patch
from app.services.rti_service import process_rti_request, RTIServiceRequest
from app.models.response_models import SearchResponse, SearchResult


@pytest.mark.integration
@patch("app.services.rti_service.search_documents")
@patch("app.services.rti_service.GeminiRTIClient.generate_rti_draft")
def test_rti_workflow_search_before_filing(mock_gemini, mock_search, sample_citations):
    # Low confidence search -> Generates RTI draft preserving applicant details
    mock_search.return_value = SearchResponse(
        success=True,
        message="No docs",
        query="Road repair budget Ward 5",
        totalResults=0,
        results=[],
        citations=[],
        executionTimeMs=5.0
    )
    mock_gemini.return_value = "FORMAL RTI DRAFT TEXT"

    req = RTIServiceRequest(
        informationRequested="Road repair budget Ward 5",
        applicantName="Sunil Sharma",
        applicantAddress="Jaipur, Rajasthan",
        applicantEmail="sunil@example.com",
        applicantPhone="9829012345",
        department="Public Works Department"
    )

    res = process_rti_request(req)

    assert res.success is True
    assert res.shouldFileRTI is True
    assert res.draft.applicantName == "Sunil Sharma"
    assert res.draft.applicantEmail == "sunil@example.com"
    mock_search.assert_called_once()
    mock_gemini.assert_called_once()
