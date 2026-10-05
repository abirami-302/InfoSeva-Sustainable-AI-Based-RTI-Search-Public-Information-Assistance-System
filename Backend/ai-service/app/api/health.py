from fastapi import APIRouter
from app.database.chroma_client import get_chroma_client
from app.database.mongodb import get_database

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Health check endpoint")
async def health_check():
    """
    Checks system health and database connections (MongoDB and ChromaDB).
    """
    mongo_status = "healthy"
    chroma_status = "healthy"

    try:
        db = get_database()
        await db.command("ping")
    except Exception:
        mongo_status = "unhealthy"

    try:
        client = get_chroma_client()
        client.heartbeat()
    except Exception:
        chroma_status = "unhealthy"

    overall_status = "healthy" if mongo_status == "healthy" and chroma_status == "healthy" else "degraded"

    return {
        "status": overall_status,
        "services": {
            "mongodb": mongo_status,
            "chromadb": chroma_status
        }
    }
