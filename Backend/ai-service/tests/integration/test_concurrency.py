import pytest
import asyncio
from unittest.mock import patch
from app.services.search_service import search_documents
from app.models.search_model import SearchResultModel


@pytest.mark.integration
@pytest.mark.asyncio
@patch("app.services.search_service.search_similar_documents")
async def test_concurrent_search_requests(mock_search_similar, sample_document_metadata):
    mock_search_similar.return_value = [
        SearchResultModel(
            documentId="doc_test_123",
            score=0.85,
            chunkText="PM Kisan details",
            metadata=sample_document_metadata
        )
    ]

    async def run_search(query_str: str):
        return await asyncio.to_thread(search_documents, query=query_str, top_k=5)

    # Execute 5 concurrent search tasks
    tasks = [run_search(f"PM Kisan Query #{i}") for i in range(5)]
    results = await asyncio.gather(*tasks)

    assert len(results) == 5
    for res in results:
        assert res.success is True
        assert res.totalResults == 1
