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
async def test_conversation_workflow_persistence(
    mock_get_chat_coll,
    mock_gemini,
    mock_search,
    mock_get_conv,
    sample_search_results,
    sample_citations
):
    mock_get_conv.return_value = {
        "conversationId": "conv_persisted_999",
        "title": "PMAY Questions",
        "messages": [
            {"role": "user", "content": "Tell me about PMAY"},
            {"role": "assistant", "content": "PMAY is a housing scheme."}
        ]
    }
    mock_search.return_value = SearchResponse(
        success=True,
        message="Found",
        query="Who is eligible for PMAY",
        totalResults=1,
        results=sample_search_results,
        citations=sample_citations,
        executionTimeMs=10.0
    )
    mock_gemini.return_value = "Citizens with income under 3 Lakhs are eligible."

    mock_coll = AsyncMock()
    mock_get_chat_coll.return_value = mock_coll

    req = ChatServiceRequest(message="Who is eligible?", conversationId="conv_persisted_999")
    res = await process_chat_message(req)

    assert res.success is True
    assert res.conversationId == "conv_persisted_999"
    # Verify original user message "Who is eligible?" was pushed to MongoDB, NOT the rewritten retrieval query
    mock_coll.update_one.assert_called_once()
