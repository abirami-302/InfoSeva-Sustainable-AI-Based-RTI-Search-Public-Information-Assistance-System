import threading
from typing import List, Optional
from sentence_transformers import SentenceTransformer

from app.config.constants import EMBEDDING_MODEL
from app.config.logging_config import get_logger

logger = get_logger(__name__)

class EmbeddingModelManager:
    _instance: Optional[SentenceTransformer] = None
    _lock: threading.Lock = threading.Lock()


def get_embedding_model() -> SentenceTransformer:
    """
    Lazy-loads and returns the sentence-transformers model instance in a thread-safe manner.
    """
    if EmbeddingModelManager._instance is None:
        with EmbeddingModelManager._lock:
            if EmbeddingModelManager._instance is None:
                try:
                    logger.info(f"Loading SentenceTransformer model '{EMBEDDING_MODEL}'...")
                    EmbeddingModelManager._instance = SentenceTransformer(EMBEDDING_MODEL)
                    logger.info(f"SentenceTransformer model '{EMBEDDING_MODEL}' successfully loaded.")
                except Exception as e:
                    logger.error(f"Failed to load embedding model '{EMBEDDING_MODEL}': {str(e)}")
                    raise RuntimeError(f"Embedding model loading failure: {str(e)}") from e
    return EmbeddingModelManager._instance


def embed_text(text: str) -> List[float]:
    """
    Generates a 384-dimensional vector embedding for a single text input string.
    """
    if not text or not text.strip():
        raise ValueError("Cannot generate embedding for empty text input.")
    try:
        model = get_embedding_model()
        embedding = model.encode(text, convert_to_numpy=True)
        return embedding.tolist()
    except Exception as e:
        logger.error(f"Error generating embedding for text: {str(e)}")
        raise RuntimeError(f"Failed to generate text embedding: {str(e)}") from e


def embed_batch(texts: List[str]) -> List[List[float]]:
    """
    Generates vector embeddings for a batch of text input strings.
    """
    if not texts:
        return []
    try:
        model = get_embedding_model()
        embeddings = model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()
    except Exception as e:
        logger.error(f"Error generating batch embeddings: {str(e)}")
        raise RuntimeError(f"Failed to generate batch embeddings: {str(e)}") from e
