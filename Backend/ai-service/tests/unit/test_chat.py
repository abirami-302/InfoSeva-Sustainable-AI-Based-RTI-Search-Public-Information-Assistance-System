import pytest
from unittest.mock import patch, AsyncMock

from app.services.chat_service import process_chat_message, ChatServiceRequest, _rewrite_query_for_retrieval
from app.models.response_models import SearchResponse


@pytest.mark.unit
def test_rewrite_query_for_retrieval_self_contained():
    query = "What is the eligibility for PM Kisan scheme?"
    rewritten = _rewrite_query_for_retrieval(query, history=[])
    assert rewritten == query


@pytest.mark.unit
def test_rewrite_query_for_retrieval_ambiguous_context():
    history = [
        {"role": "user", "content": "Tell me about PMAY scheme"},
        {"role": "assistant", "content": "PMAY is a housing scheme."}
    ]
    query = "Who is eligible?"
    rewritten = _rewrite_query_for_retrieval(query, history=history)
    assert "PMAY" in rewritten


@pytest.mark.unit
@pytest.mark.asyncio
@patch("app.services.chat_service._get_or_create_conversation")
@patch("app.services.chat_service.search_documents")
@patch("app.services.chat_service.GeminiChatClient.generate_answer")
@patch("app.services.chat_service.get_chat_collection")
async def test_process_chat_message_success(mock_get_chat_coll, mock_gemini, mock_search, mock_get_conv, sample_search_results, sample_citations):
    mock_get_conv.return_value = {
        "conversationId": "conv_123",
        "title": "PMAY Eligibility",
        "messages": []
    }
    mock_search.return_value = SearchResponse(
        success=True,
        message="Found",
        query="PMAY eligibility",
        totalResults=1,
        results=sample_search_results,
        citations=sample_citations,
        executionTimeMs=10.0
    )
    mock_gemini.return_value = "PMAY eligibility requires income under 3 Lakhs per annum."
    
    mock_coll = AsyncMock()
    mock_get_chat_coll.return_value = mock_coll

    req = ChatServiceRequest(message="What is the eligibility for PMAY?", conversationId="conv_123")
    res = await process_chat_message(req)

    assert res.success is True
    assert res.conversationId == "conv_123"
    assert res.answer == "PMAY eligibility requires income under 3 Lakhs per annum."
    assert len(res.citations) == 1
    mock_search.assert_called_once()
    mock_gemini.assert_called_once()
