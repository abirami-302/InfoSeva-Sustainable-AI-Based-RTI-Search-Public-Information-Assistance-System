import pytest
from unittest.mock import patch
from app.services.search_service import search_documents
from app.models.search_model import SearchResultModel


@pytest.mark.integration
@patch("app.services.search_service.search_similar_documents")
def test_search_workflow_end_to_end(mock_search_similar, sample_document_metadata):
    mock_search_similar.return_value = [
        SearchResultModel(
            documentId="doc_test_123",
            score=0.89,
            chunkText="PM Kisan provides Rs 6000 financial support.",
            metadata=sample_document_metadata
        )
    ]

    response = search_documents(query="PM Kisan financial benefits", top_k=5)

    assert response.success is True
    assert response.totalResults == 1
    assert len(response.citations) == 1
    assert response.citations[0].documentId == "doc_test_123"
    assert response.citations[0].title == "PM Kisan Scheme Operational Guidelines"
    mock_search_similar.assert_called_once()
