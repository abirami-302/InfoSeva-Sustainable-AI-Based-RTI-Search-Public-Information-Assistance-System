from fastapi import APIRouter, HTTPException, status
from app.models.request_models import SearchRequest
from app.services.search_service import search_with_filters, SearchFilter, SearchResponse

router = APIRouter(tags=["Semantic Search"])


@router.post("/search", response_model=SearchResponse, summary="Perform semantic search over government documents")
async def search_endpoint(request: SearchRequest):
    """
    Performs semantic vector search over Indian government acts, policies, and public schemes.
    """
    try:
        top_k = request.topK or 10
        is_manager = bool(request.isManager)
        return search_with_filters(
            query=request.query,
            filters=None,
            top_k=top_k,
            is_manager=is_manager,
            min_score=request.minScore
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Search failure: {str(e)}")

@router.post("/validate-gap", summary="Validate if a zero-result query is a meaningful information gap")
async def validate_gap_endpoint(request: dict):
    """
    Validates whether a search query is a meaningful, information-seeking request.
    """
    try:
        from app.services.search_service import validate_content_gap
        query = request.get("query", "")
        return validate_content_gap(query)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Validation failure: {str(e)}")
