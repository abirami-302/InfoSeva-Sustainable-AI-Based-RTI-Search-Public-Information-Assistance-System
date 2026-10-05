import pytest
from unittest.mock import MagicMock, AsyncMock
from app.models.response_models import SearchResult, Citation
from app.models.search_model import SearchResultModel


@pytest.fixture
def mock_settings(monkeypatch):
    monkeypatch.setattr("app.config.settings.settings.GEMINI_API_KEY", "mock-test-gemini-key")
    monkeypatch.setattr("app.config.settings.settings.MONGODB_URI", "mongodb://mockhost:27017")
    monkeypatch.setattr("app.config.settings.settings.CHROMA_PERSIST_DIR", "./mock_chroma_db")


@pytest.fixture
def sample_document_metadata():
    return {
        "documentId": "doc_test_123",
        "title": "PM Kisan Scheme Operational Guidelines",
        "department": "Ministry of Agriculture",
        "documentType": "Guidelines",
        "date": "2025-01-01",
        "source": "Govt Portal",
        "uploadDate": "2025-01-01T00:00:00Z"
    }


@pytest.fixture
def sample_document_text():
    return (
        "PM Kisan is a central sector government scheme providing income support of Rs 6000 per year "
        "to landholding farmer families across India in three equal installments."
    )


@pytest.fixture
def sample_search_models(sample_document_metadata):
    return [
        SearchResultModel(
            documentId=sample_document_metadata["documentId"],
            score=0.88,
            chunkText="PM Kisan provides Rs 6000 per year to farmers.",
            metadata=sample_document_metadata
        )
    ]


@pytest.fixture
def sample_search_results(sample_document_metadata):
    return [
        SearchResult(
            documentId=sample_document_metadata["documentId"],
            title=sample_document_metadata["title"],
            department=sample_document_metadata["department"],
            date=sample_document_metadata["date"],
            score=0.88,
            snippet="PM Kisan provides Rs 6000 per year to farmers."
        )
    ]


@pytest.fixture
def sample_citations(sample_document_metadata):
    return [
        Citation(
            documentId=sample_document_metadata["documentId"],
            title=sample_document_metadata["title"],
            department=sample_document_metadata["department"],
            date=sample_document_metadata["date"]
        )
    ]


@pytest.fixture
def mock_mongo_collection():
    collection = AsyncMock()
    collection.find_one = AsyncMock(return_value=None)
    collection.insert_one = AsyncMock(return_value=MagicMock(inserted_id="mock_id"))
    collection.delete_one = AsyncMock(return_value=MagicMock(deleted_count=1))
    collection.update_one = AsyncMock(return_value=MagicMock(modified_count=1))
    return collection
