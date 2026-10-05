from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
import google.generativeai as genai
from app.config.settings import settings
from app.config.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(tags=["Category Suggestion"])

# ── Category list that DataIngestion.jsx actually uses ──────────────────────
_CATEGORIES = [
    "Knowledge Base", "RTI Repository", "Schemes", "Public Services",
    "Government Orders", "Circulars", "Acts & Rules", "Notifications",
    "Gazettes", "Policies", "Reports", "Press Releases", "FAQs", "Forms",
]

_MINISTRIES = [
    "Ministry of Agriculture & Farmers Welfare",
    "Ministry of Education",
    "Ministry of Electronics & Information Technology",
    "Ministry of Health & Family Welfare",
    "Ministry of Home Affairs",
    "Ministry of Housing & Urban Affairs",
    "Ministry of Jal Shakti",
    "Ministry of Labour & Employment",
    "Ministry of Law & Justice",
    "Ministry of Micro, Small & Medium Enterprises",
    "Ministry of External Affairs",
    "Ministry of Rural Development",
    "Ministry of Skill Development & Entrepreneurship",
    "Ministry of Social Justice & Empowerment",
    "Ministry of Women & Child Development",
    "DoPT (Department of Personnel & Training)",
    "NIC (National Informatics Centre)",
]


class SuggestCategoryRequest(BaseModel):
    keyword: str


class SuggestCategoryResponse(BaseModel):
    success: bool
    keyword: str
    suggested_category: Optional[str] = None
    suggested_ministry: Optional[str] = None
    confidence: str  # "high" | "medium" | "low"
    fallback: bool   # true if Gemini unavailable — frontend must still allow manual override


_gemini_configured = False

def _ensure_gemini():
    global _gemini_configured
    if not _gemini_configured:
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set")
        genai.configure(api_key=api_key)
        _gemini_configured = True


@router.post(
    "/suggest-category",
    response_model=SuggestCategoryResponse,
    summary="Suggest government category and ministry for a search keyword"
)
async def suggest_category(request: SuggestCategoryRequest):
    """
    Given a failed citizen search keyword, uses Gemini Flash to suggest:
    - The most likely category from the DataIngestion category list
    - The most likely ministry

    Returns structured JSON. If Gemini is unavailable, returns fallback=true
    with nulls so the frontend can degrade gracefully.
    """
    keyword = request.keyword.strip()
    if not keyword:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="keyword must not be empty")

    cat_list   = "\n".join(f"- {c}" for c in _CATEGORIES)
    min_list   = "\n".join(f"- {m}" for m in _MINISTRIES)

    prompt = f"""You are a government document classification assistant for an Indian government information portal.

A citizen searched for: "{keyword}"

Your task: Classify this search query into exactly ONE category and ONE ministry from the lists below.

CATEGORIES (pick exactly one):
{cat_list}

MINISTRIES (pick exactly one):
{min_list}

Rules:
- Respond with ONLY valid JSON, no markdown, no explanation.
- Use the exact string from the list above.
- If you're unsure, pick the closest match.
- confidence must be "high", "medium", or "low".

Required JSON format:
{{"category": "<one from list>", "ministry": "<one from list>", "confidence": "<high|medium|low>"}}"""

    try:
        _ensure_gemini()
        model = genai.GenerativeModel("gemini-3.6-flash")
        response = model.generate_content(prompt)
        raw = response.text.strip()

        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        import json
        parsed = json.loads(raw)

        suggested_cat = parsed.get("category")
        suggested_min = parsed.get("ministry")
        confidence    = parsed.get("confidence", "medium")

        # Validate against allowed lists — reject hallucinations
        if suggested_cat not in _CATEGORIES:
            suggested_cat = None
            confidence = "low"
        if suggested_min not in _MINISTRIES:
            suggested_min = None

        logger.info(f"[SUGGEST-CATEGORY] keyword='{keyword}' -> category='{suggested_cat}' ministry='{suggested_min}' confidence='{confidence}'")

        return SuggestCategoryResponse(
            success=True,
            keyword=keyword,
            suggested_category=suggested_cat,
            suggested_ministry=suggested_min,
            confidence=confidence,
            fallback=False,
        )

    except Exception as e:
        logger.warning(f"[SUGGEST-CATEGORY] Gemini unavailable for '{keyword}': {e}")
        return SuggestCategoryResponse(
            success=False,
            keyword=keyword,
            suggested_category=None,
            suggested_ministry=None,
            confidence="low",
            fallback=True,
        )
