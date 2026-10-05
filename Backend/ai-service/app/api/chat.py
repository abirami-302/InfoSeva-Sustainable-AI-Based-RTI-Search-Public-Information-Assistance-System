from fastapi import APIRouter, HTTPException, status
from app.models.request_models import ChatRequest
from app.services.chat_service import process_chat_message, ChatServiceRequest, ChatServiceResponse

router = APIRouter(tags=["AI Assistant Chat"])


@router.post("/chat", response_model=ChatServiceResponse, summary="Send message to AI Assistant")
async def chat_endpoint(request: ChatRequest):
    """
    RAG AI Assistant endpoint powering conversational Q&A with document citations.
    """
    try:
        service_req = ChatServiceRequest(
            message=request.message,
            conversationId=request.conversationId,
            userId=request.userId
        )
        return await process_chat_message(service_req)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Chat error: {str(e)}")
