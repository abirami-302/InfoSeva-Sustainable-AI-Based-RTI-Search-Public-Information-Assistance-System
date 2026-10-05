from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.services.upload_service import upload_pdf, UploadResult, extract_metadata_from_pdf

router = APIRouter(tags=["Document Ingestion"])


@router.post("/extract-metadata", summary="Extract structured metadata from PDF using Gemini")
async def extract_metadata_endpoint(
    file: UploadFile = File(...),
    documentType: str = Form("Scheme")
):
    """
    Extracts text from PDF and auto-populates dynamic fields matching the requested documentType.
    """
    try:
        data = await extract_metadata_from_pdf(
            file_obj=file.file,
            filename=file.filename or "document.pdf",
            document_type=documentType
        )
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "error": str(e), "data": {}}


ALLOWED_SOURCE_TYPES = {"GOVERNMENT_VERIFIED", "COMMUNITY_SOURCED", "UNCLASSIFIED"}


@router.post("/upload", response_model=UploadResult, summary="Upload and ingest PDF document into MongoDB & ChromaDB")
async def upload_document_endpoint(
    file: UploadFile = File(...),
    title: str = Form(...),
    department: str = Form(...),
    documentType: str = Form(...),
    documentDate: str = Form(...),
    source: str = Form("Upload"),
    sourceType: Optional[str] = Form(None)
):
    """
    Ingests PDF document: Extracts text, stores metadata in MongoDB, generates embeddings,
    and indexes vector chunks in ChromaDB with transactional rollback.
    """
    if not sourceType or not sourceType.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="sourceType is required. Allowed values: GOVERNMENT_VERIFIED, COMMUNITY_SOURCED"
        )

    norm_source_type = sourceType.strip().upper()
    if norm_source_type not in ALLOWED_SOURCE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid sourceType: '{sourceType}'. Allowed values: GOVERNMENT_VERIFIED, COMMUNITY_SOURCED, UNCLASSIFIED"
        )

    try:
        contents = await file.read()
        file_size = len(contents)
        file.file.seek(0)

        result = await upload_pdf(
            file_obj=file.file,
            filename=file.filename or "uploaded.pdf",
            file_size=file_size,
            title=title,
            department=department,
            document_type=documentType,
            document_date=documentDate,
            source=source,
            source_type=norm_source_type
        )

        if not result.success:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Upload ingestion error: {str(e)}")

