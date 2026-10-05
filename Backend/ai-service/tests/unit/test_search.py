import pytest
from unittest.mock import patch

from app.services.search_service import search_documents, search_with_filters, SearchFilter
from app.models.search_model import SearchResultModel


@pytest.mark.unit
@patch("app.services.search_service.search_similar_documents")
def test_search_documents_success(mock_search_similar, sample_search_models):
    mock_search_similar.return_value = sample_search_models

    response = search_documents(query="PM Kisan scheme benefits", top_k=5)

    assert response.success is True
    assert response.totalResults == 1
    assert len(response.results) == 1
    assert len(response.citations) == 1
    assert response.results[0].documentId == "doc_test_123"
    assert response.results[0].title == "PM Kisan Scheme Operational Guidelines"
    mock_search_similar.assert_called_once()


@pytest.mark.unit
@patch("app.services.search_service.search_similar_documents")
def test_search_documents_no_results(mock_search_similar):
    mock_search_similar.return_value = []

    response = search_documents(query="Nonexistent topic xyz", top_k=5)

    assert response.success is True
    assert response.totalResults == 0
    assert len(response.results) == 0
    assert "No sufficiently relevant government documents" in response.message


@pytest.mark.unit
def test_search_documents_empty_query():
    with pytest.raises(ValueError):
        search_documents(query="   ", top_k=5)


@pytest.mark.unit
@patch("app.services.search_service.search_similar_documents")
def test_search_with_department_filter(mock_search_similar, sample_search_models):
    mock_search_similar.return_value = sample_search_models
    filters = SearchFilter(department="Agriculture")

    response = search_with_filters(query="PM Kisan benefits", filters=filters, top_k=5)

    assert response.success is True
    assert response.totalResults == 1


@pytest.mark.unit
@patch("app.services.search_service.search_similar_documents")
def test_search_with_department_filter_no_match(mock_search_similar, sample_search_models):
    mock_search_similar.return_value = sample_search_models
    filters = SearchFilter(department="Education")

    response = search_with_filters(query="PM Kisan benefits", filters=filters, top_k=5)

    assert response.success is True
    assert response.totalResults == 0


@pytest.mark.unit
@patch("app.services.search_service.search_similar_documents")
def test_search_unicode_and_regional_inputs(mock_search_similar, sample_search_models):
    mock_search_similar.return_value = sample_search_models

    # Tamil input
    res_tamil = search_documents(query="பி.எம். கிசான் திட்டம்", top_k=5)
    assert res_tamil.success is True

    # Hindi input
    res_hindi = search_documents(query="पीएम किसान योजना", top_k=5)
    assert res_hindi.success is True
