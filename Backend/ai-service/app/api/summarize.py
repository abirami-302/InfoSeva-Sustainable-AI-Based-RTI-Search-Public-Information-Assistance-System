from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel
from typing import Optional
import io

from app.models.request_models import SummarizeRequest
from app.models.response_models import SummaryResponse
from app.services.summary_service import summarize_document, GeminiSummarizerClient
from app.utils.pdf_utils import extract_text_from_pdf
from app.utils.file_utils import save_temp_file, delete_temp_file
from app.utils.text_utils import clean_text
from app.config.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(tags=["Summarization"])


# ── Request / Response models for document Q&A ──────────────────────────────

class DocumentAskRequest(BaseModel):
    question: str
    documentText: str   # The extracted PDF text (sent back by frontend from session)
    documentTitle: Optional[str] = "Government Document"


class DocumentAskResponse(BaseModel):
    answer: str


# ── Text-based summarize (existing, for documentId or raw text) ──────────────

@router.post("/summarize", response_model=SummaryResponse, summary="Summarize government document (text or documentId)")
async def summarize_endpoint(request: SummarizeRequest):
    """
    Generates structured AI summary of a government document using Gemini 2.5 Flash.
    Accepts either a documentId (looks up MongoDB) or raw text.
    """
    try:
        return await summarize_document(request)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Summarization failure: {str(e)}")


# ── PDF file upload → summarize ───────────────────────────────────────────────

@router.post("/summarize/upload", response_model=SummaryResponse, summary="Summarize an uploaded PDF file")
async def summarize_upload_endpoint(
    file: UploadFile = File(..., description="PDF file to summarize"),
):
    """
    Accepts a PDF file upload directly, extracts text using PyMuPDF,
    then generates a structured AI summary using Gemini 2.5 Flash.
    The document is NOT stored permanently — processed in memory only.
    """
    temp_path = None
    try:
        filename = file.filename or "upload.pdf"
        if not filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are supported. Please upload a .pdf file."
            )

        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty."
            )

        file_size = len(file_bytes)
        logger.info(f"Received PDF upload for summarization: '{filename}' ({file_size} bytes)")

        temp_path = save_temp_file(io.BytesIO(file_bytes), filename)
        logger.info(f"Saved temp file at: {temp_path}")

        raw_text = extract_text_from_pdf(temp_path)
        if not raw_text or not raw_text.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Could not extract text from this PDF. It may be a scanned image-only PDF. Please try a text-based PDF."
            )

        logger.info(f"Extracted {len(raw_text)} characters from '{filename}'")

        request = SummarizeRequest(text=raw_text)
        result = await summarize_document(request)

        # Use filename as title fallback
        if not result.title or result.title == "Government Document":
            clean_name = filename.replace(".pdf", "").replace("_", " ").replace("-", " ").strip()
            result.title = clean_name

        return result

    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Error in summarize_upload_endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Summarization failed: {str(e)}"
        )
    finally:
        if temp_path:
            try:
                delete_temp_file(temp_path)
            except Exception:
                pass


# ── Document Q&A — answer questions grounded in extracted document text ───────

@router.post("/summarize/ask", response_model=DocumentAskResponse, summary="Ask a question about an uploaded document")
async def ask_about_document(request: DocumentAskRequest):
    """
    Answers a user question grounded solely in the provided document text.
    Uses Gemini 2.5 Flash. The document text is passed by the frontend (not stored server-side).
    """
    try:
        if not request.question or not request.question.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question cannot be empty.")
        if not request.documentText or not request.documentText.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document text cannot be empty.")

        cleaned_text = clean_text(request.documentText)
        # Truncate to avoid token limits
        if len(cleaned_text) > 30000:
            cleaned_text = cleaned_text[:30000]

        prompt = f"""You are an expert Government Information Assistant. A citizen has uploaded a government document and is asking a question about it.

DOCUMENT TITLE: {request.documentTitle}

DOCUMENT TEXT:
==================================================
{cleaned_text}
==================================================

CITIZEN'S QUESTION: {request.question.strip()}

INSTRUCTIONS:
- Answer ONLY based on the information present in the document above.
- If the answer is not found in the document, say: "This specific information is not mentioned in the document."
- Be concise, factual, and helpful.
- Use plain language suitable for an ordinary Indian citizen.
- Do NOT make up any information not present in the document.
- Format your response clearly. Use bullet points for lists.

ANSWER:"""

        answer = GeminiSummarizerClient.generate_summary(prompt)
        return DocumentAskResponse(answer=answer)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in ask_about_document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not generate answer: {str(e)}"
        )
