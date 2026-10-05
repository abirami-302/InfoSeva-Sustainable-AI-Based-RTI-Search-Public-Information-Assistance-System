import pytest
from unittest.mock import patch, AsyncMock
from app.services.chat_service import process_chat_message, ChatServiceRequest
from app.models.response_models import SearchResponse


@pytest.mark.integration
@pytest.mark.asyncio
@patch("app.services.chat_service._get_or_create_conversation")
@patch("app.services.chat_service.search_documents")
@patch("app.services.chat_service.GeminiChatClient.generate_answer")
@patch("app.services.chat_service.get_chat_collection")
async def test_chat_rag_workflow(
    mock_get_chat_coll,
    mock_gemini,
    mock_search,
    mock_get_conv,
    sample_search_results,
    sample_citations
):
    mock_get_conv.return_value = {
        "conversationId": "conv_rag_123",
        "title": "PMAY Details",
        "messages": []
    }
    mock_search.return_value = SearchResponse(
        success=True,
        message="Found",
        query="PMAY housing scheme details",
        totalResults=1,
        results=sample_search_results,
        citations=sample_citations,
        executionTimeMs=8.0
    )
    mock_gemini.return_value = "PMAY is a central government housing scheme."

    mock_coll = AsyncMock()
    mock_get_chat_coll.return_value = mock_coll

    req = ChatServiceRequest(message="Explain PMAY scheme", conversationId="conv_rag_123")
    res = await process_chat_message(req)

    assert res.success is True
    assert res.conversationId == "conv_rag_123"
    assert res.answer == "PMAY is a central government housing scheme."
    assert len(res.citations) == 1
    mock_search.assert_called_once()
    mock_gemini.assert_called_once()
    mock_coll.update_one.assert_called_once()
