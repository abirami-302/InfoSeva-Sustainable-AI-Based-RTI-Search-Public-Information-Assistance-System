import os
import re
import json
import time
from typing import Optional
import google.generativeai as genai

from app.config.settings import settings
from app.config.constants import MAX_SUMMARY_TOKENS
from app.config.logging_config import get_logger
from app.models.request_models import SummarizeRequest
from app.models.response_models import SummaryResponse
from app.services.document_service import get_document, update_document
from app.utils.text_utils import clean_text

logger = get_logger(__name__)

PROMPT_TEMPLATE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "prompts",
    "summarizer_prompt.txt"
)


class GeminiSummarizerClient:
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
    def generate_summary(cls, prompt: str) -> str:
        cls._ensure_configured()
        try:
            logger.info("Sending request to Google Gemini (gemini-2.5-flash)...")
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(prompt)

            if not response or not response.text:
                logger.error("Gemini returned an empty response.")
                raise RuntimeError("Gemini API returned an empty summary response.")

            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini API error during summarization: {str(e)}")
            raise RuntimeError(f"Gemini summarization failed: {str(e)}") from e


def _load_prompt_template() -> str:
    if not os.path.exists(PROMPT_TEMPLATE_PATH):
        logger.error(f"Prompt template file not found at '{PROMPT_TEMPLATE_PATH}'.")
        raise FileNotFoundError(f"Summarizer prompt template file missing at '{PROMPT_TEMPLATE_PATH}'")

    try:
        with open(PROMPT_TEMPLATE_PATH, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        logger.error(f"Failed to load prompt template: {str(e)}")
        raise RuntimeError(f"Error reading summarizer prompt template: {str(e)}") from e


def _parse_structured_response(raw_text: str, fallback_title: str = "Government Document") -> dict:
    """
    Parse the Gemini JSON response. Strips markdown code fences if present.
    Falls back gracefully if JSON parsing fails.
    """
    # Strip ```json ... ``` or ``` ... ``` fences
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw_text.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned.strip())
    cleaned = cleaned.strip()

    try:
        data = json.loads(cleaned)
        return data
    except json.JSONDecodeError:
        # Attempt to extract JSON object if there's surrounding text
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(0))
                return data
            except json.JSONDecodeError:
                pass

    logger.warning("Could not parse structured JSON from Gemini — returning as plain summary.")
    return {
        "title": fallback_title,
        "summary": raw_text,
        "highlights": [],
        "simplified": "",
        "dates": [],
        "departments": [],
        "contacts": []
    }


async def summarize_document(
    request: SummarizeRequest,
    language: str = "English",
    max_tokens: int = MAX_SUMMARY_TOKENS
) -> SummaryResponse:
    """
    Orchestrates government document summarization using original text from MongoDB or raw text input.
    Returns a structured SummaryResponse with all display fields parsed from Gemini JSON output.
    """
    start_time = time.time()
    logger.info("Summarization request received...")

    target_text: Optional[str] = None
    doc_id: Optional[str] = request.documentId
    fallback_title = "Government Document"

    # 1. Retrieve original document text from MongoDB if documentId provided
    if doc_id:
        logger.info(f"Retrieving original document text for documentId '{doc_id}' from MongoDB...")
        doc = await get_document(doc_id)
        if not doc:
            logger.error(f"Document '{doc_id}' not found in MongoDB database.")
            raise ValueError(f"Document with ID '{doc_id}' was not found.")

        fallback_title = getattr(doc, "title", "Government Document") or "Government Document"

        # Check if pre-existing structured summary is stored
        if doc.metadata and doc.metadata.get("structured_summary"):
            logger.info(f"Pre-existing structured summary found in MongoDB for document '{doc_id}'. Returning cached.")
            cached = doc.metadata["structured_summary"]
            if isinstance(cached, dict):
                return SummaryResponse(
                    summary=cached.get("summary", ""),
                    title=cached.get("title", fallback_title),
                    highlights=cached.get("highlights", []),
                    simplified=cached.get("simplified", ""),
                    dates=cached.get("dates", []),
                    departments=cached.get("departments", []),
                    contacts=cached.get("contacts", [])
                )

        # Check if full text is stored in sourceFile or metadata
        if doc.metadata and doc.metadata.get("fullText"):
            target_text = doc.metadata["fullText"]
        elif doc.sourceFile and os.path.exists(doc.sourceFile):
            try:
                with open(doc.sourceFile, "r", encoding="utf-8") as f:
                    target_text = f.read()
            except Exception:
                logger.warning(f"Could not read source file '{doc.sourceFile}'. Falling back to title/description.")

        if not target_text:
            target_text = f"Title: {doc.title}\nDepartment: {doc.department}\nType: {doc.documentType}"

    elif request.text and request.text.strip():
        target_text = request.text.strip()
    else:
        logger.error("Summarization failed: Neither documentId nor text payload was provided.")
        raise ValueError("Either documentId or raw text must be provided for summarization.")

    cleaned_text = clean_text(target_text)
    if not cleaned_text:
        raise ValueError("Extracted document text is empty after cleaning.")

    # Truncate very large texts to avoid Gemini token limits (keep first ~30000 chars)
    if len(cleaned_text) > 30000:
        logger.warning(f"Document text is very large ({len(cleaned_text)} chars). Truncating to 30000 chars.")
        cleaned_text = cleaned_text[:30000]

    # 2. Construct Gemini prompt using external template
    logger.info("Constructing summarizer prompt template...")
    template = _load_prompt_template()
    prompt = template.format(
        document_text=cleaned_text,
        max_tokens=max_tokens,
        language=language
    )

    # 3. Call Gemini
    logger.info(f"Generating structured summary with Gemini 2.5 Flash for text length {len(cleaned_text)} chars...")
    raw_output = GeminiSummarizerClient.generate_summary(prompt)

    # 4. Parse structured JSON
    parsed = _parse_structured_response(raw_output, fallback_title=fallback_title)

    # 5. Store structured summary in MongoDB if documentId exists
    if doc_id:
        try:
            logger.info(f"Saving generated structured summary back to MongoDB for document '{doc_id}'...")
            await update_document(doc_id, {"metadata.structured_summary": parsed})
        except Exception as e:
            logger.warning(f"Failed to persist structured summary in MongoDB for document '{doc_id}': {str(e)}")

    duration_ms = round((time.time() - start_time) * 1000, 2)
    logger.info(f"Summarization completed successfully in {duration_ms}ms.")

    return SummaryResponse(
        summary=parsed.get("summary", raw_output),
        title=parsed.get("title", fallback_title),
        highlights=parsed.get("highlights") or [],
        simplified=parsed.get("simplified", ""),
        dates=parsed.get("dates") or [],
        departments=parsed.get("departments") or [],
        contacts=parsed.get("contacts") or []
    )
