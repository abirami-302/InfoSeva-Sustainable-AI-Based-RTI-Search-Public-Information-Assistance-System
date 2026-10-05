import re
from typing import Dict, Any, Optional
from app.config.logging_config import get_logger

logger = get_logger(__name__)


def sanitize_text(text: Optional[str]) -> str:
    """
    Sanitizes string input by removing control characters, NULL bytes, and trimming whitespace.
    """
    if not text:
        return ""

    # Remove NULL bytes & non-printable control characters (except newline, tab)
    sanitized = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", text)
    return sanitized.strip()


def validate_query(query: str) -> str:
    """
    Validates user query input. Rejects empty queries or queries shorter than 2 characters.
    """
    cleaned = sanitize_text(query)

    if not cleaned:
        logger.warning("Empty search or chat query received.")
        raise ValueError("Query string cannot be empty.")

    if len(cleaned) < 2:
        logger.warning(f"Query string '{cleaned}' is too short.")
        raise ValueError("Query string must be at least 2 characters long.")

    return cleaned


def validate_document_metadata(metadata: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates document metadata payload ensuring required fields are present.
    Required fields: title, department, documentType, date.
    """
    if not isinstance(metadata, dict):
        raise ValueError("Document metadata must be a dictionary.")

    required_fields = ["title", "department", "documentType", "date"]
    missing_fields = [field for field in required_fields if not metadata.get(field)]

    if missing_fields:
        logger.warning(f"Metadata validation failed. Missing fields: {missing_fields}")
        raise ValueError(f"Missing required metadata fields: {', '.join(missing_fields)}")

    cleaned_metadata = {
        key: sanitize_text(str(val)) if isinstance(val, str) else val
        for key, val in metadata.items()
    }

    return cleaned_metadata
