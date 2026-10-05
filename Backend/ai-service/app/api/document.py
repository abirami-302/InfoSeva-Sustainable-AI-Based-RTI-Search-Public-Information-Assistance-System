from fastapi import APIRouter, HTTPException, status
from app.services.document_service import get_all_documents, get_document, delete_document
from app.models.document_model import DocumentModel

router = APIRouter(tags=["Document Management"])


@router.get("/documents", response_model=list[DocumentModel], summary="List all government documents metadata")
async def list_documents_endpoint(limit: int = 50, skip: int = 0):
    try:
        return await get_all_documents(limit=limit, skip=skip)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/documents/{document_id}", response_model=DocumentModel, summary="Get document metadata by ID")
async def get_document_endpoint(document_id: str):
    doc = await get_document(document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Document '{document_id}' not found.")
    return doc


from pydantic import BaseModel

class DocumentStatusUpdate(BaseModel):
    status: str

@router.patch("/documents/{document_id}/status", summary="Update document approval status")
async def update_status_endpoint(document_id: str, payload: DocumentStatusUpdate):
    from app.services.document_service import update_document_status
    doc = await update_document_status(document_id, payload.status)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Document '{document_id}' not found.")
    return {"success": True, "message": f"Document '{document_id}' status updated to {payload.status}.", "data": doc}


@router.delete("/documents/{document_id}", summary="Delete document metadata and ChromaDB vector embeddings")
async def delete_document_endpoint(document_id: str):
    deleted = await delete_document(document_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Document '{document_id}' not found.")
    return {"success": True, "message": f"Document '{document_id}' and associated vector embeddings deleted."}
