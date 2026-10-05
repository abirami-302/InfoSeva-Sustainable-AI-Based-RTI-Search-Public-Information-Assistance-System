import time
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.config.constants import TOP_K_RESULTS, SIMILARITY_THRESHOLD
from app.config.logging_config import get_logger
from app.utils.validation import validate_query, sanitize_text
from app.vectorstore.similarity_search import search_similar_documents
from app.models.response_models import SearchResult, Citation
from app.models.search_model import SearchResultModel

logger = get_logger(__name__)


class SearchResponse(BaseModel):
    success: bool = Field(..., description="Search operation status")
    message: str = Field(..., description="Status summary or warning message")
    query: str = Field(..., description="Sanitized query string")
    totalResults: int = Field(..., description="Count of relevant results returned")
    results: List[SearchResult] = Field(default_factory=list, description="Ranked list of search result items")
    citations: List[Citation] = Field(default_factory=list, description="List of document citations")
    executionTimeMs: float = Field(..., description="Search execution duration in milliseconds")


class SearchFilter(BaseModel):
    department: Optional[str] = None
    documentType: Optional[str] = None
    dateFrom: Optional[str] = None
    dateTo: Optional[str] = None


def build_citations(search_models: List[SearchResultModel]) -> List[Citation]:
    """
    Builds citation objects from vector search model results.
    """
    citations: List[Citation] = []
    seen_ids = set()

    for item in search_models:
        meta = item.metadata or {}
        doc_id = item.documentId

        if doc_id not in seen_ids:
            seen_ids.add(doc_id)
            citation = Citation(
                documentId=doc_id,
                title=str(meta.get("title", "Untitled Document")),
                department=str(meta.get("department", "General")),
                date=str(meta.get("date", "N/A"))
            )
            citations.append(citation)

    return citations


def format_search_results(search_models: List[SearchResultModel]) -> List[SearchResult]:
    """
    Converts internal SearchResultModel items into SearchResult response objects.
    """
    formatted: List[SearchResult] = []
    for item in search_models:
        meta = item.metadata or {}
        raw_source_type = meta.get("source_type") or meta.get("sourceType") or "UNCLASSIFIED"
        res = SearchResult(
            documentId=item.documentId,
            title=str(meta.get("title", "Untitled Document")),
            department=str(meta.get("department", "General")),
            date=str(meta.get("date", "N/A")),
            score=item.score,
            snippet=item.chunkText,
            sourceType=str(raw_source_type)
        )
        formatted.append(res)
    return formatted


def _parse_date(date_str: str) -> Optional[datetime]:
    """
    Helper function to parse ISO date string safely.
    """
    if not date_str or date_str == "N/A":
        return None
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y/%m/%d"):
        try:
            return datetime.strptime(date_str[:10], fmt[:10])
        except ValueError:
            continue
    return None


def _apply_in_memory_filters(
    items: List[SearchResultModel],
    filters: Optional[SearchFilter]
) -> List[SearchResultModel]:
    """
    Filters search results based on department, documentType, and date bounds.
    """
    if not filters:
        return items

    filtered: List[SearchResultModel] = []

    for item in items:
        meta = item.metadata or {}

        # Department filter
        if filters.department:
            dept = str(meta.get("department", "")).lower()
            if filters.department.lower() not in dept:
                continue

        # Document Type filter
        if filters.documentType:
            doc_type = str(meta.get("documentType", "")).lower()
            if filters.documentType.lower() not in doc_type:
                continue

        # Date range filter
        doc_date = _parse_date(str(meta.get("date", "")))
        if doc_date:
            if filters.dateFrom:
                from_date = _parse_date(filters.dateFrom)
                if from_date and doc_date < from_date:
                    continue
            if filters.dateTo:
                to_date = _parse_date(filters.dateTo)
                if to_date and doc_date > to_date:
                    continue

        filtered.append(item)

    return filtered


def _rank_search_results(items: List[SearchResultModel]) -> List[SearchResultModel]:
    """
    Ranks search items by similarity score (desc), document date (newest first), and department.
    """
    def sorting_key(item: SearchResultModel):
        meta = item.metadata or {}
        score = item.score
        doc_date = _parse_date(str(meta.get("date", "")))
        date_timestamp = doc_date.timestamp() if doc_date else 0.0
        dept = str(meta.get("department", "")).lower()
        return (score, date_timestamp, dept)

    return sorted(items, key=sorting_key, reverse=True)


def search_with_filters(
    query: str,
    filters: Optional[SearchFilter] = None,
    top_k: int = TOP_K_RESULTS,
    is_manager: bool = False,
    min_score: Optional[float] = None
) -> SearchResponse:
    """
    Executes filtered semantic document search and returns structured SearchResponse with citations.
    """
    start_time = time.time()
    logger.info("Search operation initiated...")

    try:
        # Step 1 & 2: Validate and sanitize query
        sanitized_query = validate_query(query)
        logger.info(f"Search query sanitized: '{sanitized_query[:60]}...'")

        if filters:
            logger.info(f"Applied filters: {filters.model_dump(exclude_none=True)}")

        # Step 3, 4, 5 & 6: Vector search & similarity threshold filtering
        raw_results = search_similar_documents(
            query=sanitized_query,
            top_k=top_k * 2,
            is_manager=is_manager,
            min_score=min_score if min_score is not None else 0.35
        )

        # Apply post-retrieval filters
        filtered_results = _apply_in_memory_filters(raw_results, filters)
        logger.info(f"Retrieved {len(raw_results)} vector matches, {len(filtered_results)} remaining after filtering.")

        # Rank results
        ranked_results = _rank_search_results(filtered_results)[:top_k]

        execution_time_ms = round((time.time() - start_time) * 1000, 2)

        if not ranked_results:
            logger.info("No relevant government documents found meeting criteria.")
            return SearchResponse(
                success=True,
                message="No sufficiently relevant government documents were found.",
                query=sanitized_query,
                totalResults=0,
                results=[],
                citations=[],
                executionTimeMs=execution_time_ms
            )

        # Step 7 & 8: Build citations and response objects
        citations = build_citations(ranked_results)
        formatted_results = format_search_results(ranked_results)

        logger.info(f"Search successfully completed in {execution_time_ms}ms with {len(formatted_results)} results.")

        return SearchResponse(
            success=True,
            message=f"Successfully retrieved {len(formatted_results)} relevant document matches.",
            query=sanitized_query,
            totalResults=len(formatted_results),
            results=formatted_results,
            citations=citations,
            executionTimeMs=execution_time_ms
        )

    except ValueError as ve:
        execution_time_ms = round((time.time() - start_time) * 1000, 2)
        logger.warning(f"Search validation error: {str(ve)}")
        raise ValueError(f"Invalid search request: {str(ve)}") from ve

    except Exception as e:
        execution_time_ms = round((time.time() - start_time) * 1000, 2)
        logger.error(f"Search operation failed: {str(e)}")
        raise RuntimeError(f"Semantic search service failure: {str(e)}") from e


def search_documents(query: str, top_k: int = TOP_K_RESULTS) -> SearchResponse:
    """
    Executes standard semantic search over government documents without filters.
    """
    return search_with_filters(query=query, filters=None, top_k=top_k)

def validate_content_gap(query: str) -> dict:
    """
    Validates whether a search query is a meaningful, information-seeking request using Gemini.
    """
    import google.generativeai as genai
    from app.config.settings import settings
    import json
    import re
    
    try:
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            return {"valid": False}
            
        genai.configure(api_key=api_key)
        
        # Use Structured JSON output via generation_config
        model = genai.GenerativeModel("gemini-2.5-flash", generation_config={"response_mime_type": "application/json"})
        
        prompt = f"""
        Classify whether the following search query is a meaningful information-seeking request for government information.
        
        Reject:
        - greetings (e.g. hello, hi)
        - random characters or gibberish (e.g. asdfghjkl, GGFJJ)
        - test strings (e.g. test, 123)
        - usernames/IDs or random alphanumeric strings (e.g. SECRET_KEYWORD_12345)
        - meaningless keywords, profanity, or non-information chatter
        
        Accept:
        - government schemes, benefits, certificates
        - laws, rules, policies
        - government services, application procedures, eligibility questions
        - citizen rights, departments/services
        - meaningful requests for government information
        
        Return strict JSON only: {{"valid": true}} or {{"valid": false}}.
        
        Query: "{query}"
        """
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Safely extract JSON
        try:
            start_idx = text.find('{')
            end_idx = text.rfind('}')
            if start_idx != -1 and end_idx != -1:
                json_str = text[start_idx:end_idx+1]
                data = json.loads(json_str)
                is_valid = data.get("valid")
                if isinstance(is_valid, bool):
                    return {"valid": is_valid}
                if str(is_valid).lower() == "true":
                    return {"valid": True}
        except Exception as parse_error:
            logger.error(f"Failed to parse Gemini JSON: {parse_error} - Raw text: {text}")
            
        return {"valid": False}
    except Exception as e:
        logger.error(f"Error validating content gap with Gemini: {e}")
        # Robust heuristic fallback: if query has reasonable length, contains letters and isn't obvious gibberish/test
        q_clean = query.strip().lower()
        stopwords_reject = {"test", "hello", "hi", "hey", "asdf", "qwerty", "123", "abc"}
        if len(q_clean) >= 3 and q_clean not in stopwords_reject and not re.match(r'^[0-9\W_]+$', q_clean):
            # Check for vowel or word-like structure
            if re.search(r'[aeiouy]', q_clean):
                logger.info(f"Fallback validation accepted query: '{query}'")
                return {"valid": True}
        return {"valid": False}
