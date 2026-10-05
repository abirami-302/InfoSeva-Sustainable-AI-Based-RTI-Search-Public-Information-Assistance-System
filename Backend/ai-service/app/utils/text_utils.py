import re
from typing import List
from app.config.constants import CHUNK_SIZE, CHUNK_OVERLAP


def clean_text(text: str) -> str:
    """
    Cleans raw text by removing excessive whitespace, normalizing line breaks,
    and trimming spaces while preserving paragraph boundaries.
    """
    if not text:
        return ""

    # Normalize carriage returns
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Replace 3 or more consecutive newlines with 2 newlines (preserve paragraphs)
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Replace multiple horizontal spaces/tabs within a line with a single space
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]

    return "\n".join(lines).strip()


def split_text_into_chunks(
    text: str,
    chunk_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP
) -> List[str]:
    """
    Splits text into overlapping chunks using word boundaries.
    """
    cleaned = clean_text(text)
    if not cleaned:
        return []

    if chunk_size <= 0:
        raise ValueError("chunk_size must be a positive integer.")
    if overlap < 0 or overlap >= chunk_size:
        raise ValueError("overlap must be non-negative and less than chunk_size.")

    words = cleaned.split(" ")
    if not words:
        return []

    chunks: List[str] = []
    start = 0
    total_words = len(words)

    # Approximate words per chunk assuming average ~5 chars per word
    words_per_chunk = max(1, chunk_size // 5)
    words_overlap = max(0, overlap // 5)

    step = max(1, words_per_chunk - words_overlap)

    while start < total_words:
        end = min(start + words_per_chunk, total_words)
        chunk = " ".join(words[start:end]).strip()
        if chunk:
            chunks.append(chunk)
        if end >= total_words:
            break
        start += step

    return chunks
