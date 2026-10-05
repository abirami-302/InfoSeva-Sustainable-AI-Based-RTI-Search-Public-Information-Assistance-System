import os
import time
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import google.generativeai as genai

from app.config.settings import settings
from app.config.constants import SIMILARITY_THRESHOLD
from app.config.logging_config import get_logger
from app.utils.validation import sanitize_text, validate_query
from app.services.search_service import search_documents, SearchFilter
from app.models.response_models import Citation, SearchResult

logger = get_logger(__name__)

PROMPT_TEMPLATE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "prompts",
    "rti_prompt.txt"
)


class RTIServiceRequest(BaseModel):
    informationRequested: str = Field(..., description="Core question or subject of RTI query")
    applicantName: Optional[str] = Field("Citizen Applicant", description="Full name of applicant")
    applicantAddress: Optional[str] = Field("India", description="Postal address of applicant")
    applicantEmail: Optional[str] = Field("N/A", description="Contact email of applicant")
    applicantPhone: Optional[str] = Field("N/A", description="Contact phone of applicant")
    subject: Optional[str] = Field(None, description="Optional custom RTI subject line")
    department: Optional[str] = Field(None, description="Target government department")
    preferredLanguage: Optional[str] = Field("English", description="Preferred language for RTI draft")


class RTIDraftStructure(BaseModel):
    applicantName: str
    applicantAddress: str
    applicantEmail: str
    applicantPhone: str
    subject: str
    publicAuthority: str
    informationRequested: str
    body: str
    date: str
    signature: str


class RTIProcessResponse(BaseModel):
    success: bool
    shouldFileRTI: bool
    reason: str
    confidence: float
    department: str
    searchResults: List[SearchResult] = Field(default_factory=list)
    citations: List[Citation] = Field(default_factory=list)
    executionTimeMs: float
    draft: Optional[RTIDraftStructure] = None
    formattedDraft: Optional[str] = None


class GeminiRTIClient:
    _configured: bool = False

    @classmethod
    def _ensure_configured(cls) -> None:
        if not cls._configured:
            api_key = settings.GEMINI_API_KEY
            if not api_key:
                logger.error("GEMINI_API_KEY is not configured in environment settings.")
                raise ValueError("Gemini API key is missing. Set GEMINI_API_KEY in .env.")
            genai.configure(api_key=api_key)
            cls._configured = True

    @classmethod
    def generate_rti_draft(cls, prompt: str) -> str:
        cls._ensure_configured()
        try:
            logger.info("Sending request to Google Gemini (gemini-2.5-flash) for RTI draft...")
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(prompt)

            if not response or not response.text:
                logger.error("Gemini returned an empty response for RTI draft.")
                raise RuntimeError("Gemini API returned an empty RTI draft response.")

            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini API error during RTI drafting: {str(e)}")
            raise RuntimeError(f"Gemini RTI drafting failed: {str(e)}") from e


def _load_prompt_template() -> str:
    if not os.path.exists(PROMPT_TEMPLATE_PATH):
        logger.error(f"RTI Prompt template file not found at '{PROMPT_TEMPLATE_PATH}'.")
        raise FileNotFoundError(f"RTI prompt template file missing at '{PROMPT_TEMPLATE_PATH}'")

    try:
        with open(PROMPT_TEMPLATE_PATH, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        logger.error(f"Failed to load RTI prompt template: {str(e)}")
        raise RuntimeError(f"Error reading RTI prompt template: {str(e)}") from e


def _infer_department(requested_dept: Optional[str], search_results: List[SearchResult]) -> str:
    if requested_dept and requested_dept.strip():
        return requested_dept.strip()

    if search_results:
        top_meta_dept = search_results[0].department
        if top_meta_dept and top_meta_dept.lower() != "general":
            return top_meta_dept

    return "Relevant Public Authority"


def process_rti_request(request: RTIServiceRequest) -> RTIProcessResponse:
    """
    Implements the 'Search Before Filing' workflow:
    Search -> Evaluate Confidence -> If Answer Exists Return Citations (shouldFileRTI=False) -> Else Generate Gemini RTI Draft.
    """
    start_time = time.time()
    logger.info("RTI request received. Starting Search Before Filing workflow...")

    try:
        query = validate_query(request.informationRequested)
        applicant_name = sanitize_text(request.applicantName) or "Citizen Applicant"
        applicant_address = sanitize_text(request.applicantAddress) or "India"
        applicant_email = sanitize_text(request.applicantEmail) or "N/A"
        applicant_phone = sanitize_text(request.applicantPhone) or "N/A"
        language = sanitize_text(request.preferredLanguage) or "English"

        # Step 1: Search Before Filing
        logger.info(f"Executing semantic Search Before Filing for: '{query[:50]}...'")
        search_res = search_documents(query=query, top_k=5)

        highest_score = search_res.results[0].score if search_res.results else 0.0
        department = _infer_department(request.department, search_res.results)

        # High confidence match (score >= SIMILARITY_THRESHOLD): Info is already available publicly
        HIGH_CONFIDENCE_THRESHOLD = SIMILARITY_THRESHOLD + 0.05
        if highest_score >= HIGH_CONFIDENCE_THRESHOLD and search_res.results:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            logger.info(f"Search Before Filing found high-confidence public document (Score: {highest_score}). RTI filing not required.")
            return RTIProcessResponse(
                success=True,
                shouldFileRTI=False,
                reason="Sufficient information was found in existing public government documents. Filing an RTI is not necessary.",
                confidence=highest_score,
                department=department,
                searchResults=search_res.results,
                citations=search_res.citations,
                executionTimeMs=duration_ms,
                draft=None,
                formattedDraft=None
            )

        # Step 2: Information unavailable or low confidence -> Generate RTI Application
        logger.info("Sufficient information not found in vector store. Proceeding to RTI draft generation...")
        search_summary = "\n".join([f"- {r.title} ({r.department}): {r.snippet}" for r in search_res.results[:3]]) if search_res.results else "No relevant public documents found."
        subject_line = request.subject or f"Request for information regarding {query[:60]}"

        template = _load_prompt_template()
        prompt = template.format(
            applicant_name=applicant_name,
            applicant_address=applicant_address,
            applicant_email=applicant_email,
            applicant_phone=applicant_phone,
            department=department,
            subject=subject_line,
            citizen_query=query,
            search_findings=search_summary,
            preferred_language=language
        )

        formatted_draft = GeminiRTIClient.generate_rti_draft(prompt)
        current_date_str = datetime.now().strftime("%Y-%m-%d")

        structured_draft = RTIDraftStructure(
            applicantName=applicant_name,
            applicantAddress=applicant_address,
            applicantEmail=applicant_email,
            applicantPhone=applicant_phone,
            subject=subject_line,
            publicAuthority=department,
            informationRequested=query,
            body=formatted_draft,
            date=current_date_str,
            signature=f"[{applicant_name}]"
        )

        duration_ms = round((time.time() - start_time) * 1000, 2)
        logger.info(f"RTI draft generated successfully in {duration_ms}ms.")

        return RTIProcessResponse(
            success=True,
            shouldFileRTI=True,
            reason="Public documents do not contain sufficient information regarding your query. An RTI draft has been generated for submission.",
            confidence=highest_score,
            department=department,
            searchResults=search_res.results,
            citations=search_res.citations,
            executionTimeMs=duration_ms,
            draft=structured_draft,
            formattedDraft=formatted_draft
        )

    except Exception as e:
        duration_ms = round((time.time() - start_time) * 1000, 2)
        logger.error(f"RTI Service workflow failed: {str(e)}")
        raise RuntimeError(f"RTI Service failure: {str(e)}") from e
