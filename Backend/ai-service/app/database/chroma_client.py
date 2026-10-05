from typing import Optional
import chromadb
from chromadb.api import ClientAPI
from chromadb.api.models.Collection import Collection
from chromadb.utils import embedding_functions

from app.config.settings import settings
from app.config.constants import CHROMA_COLLECTION, EMBEDDING_MODEL
from app.config.logging_config import get_logger

logger = get_logger(__name__)

class ChromaManager:
    client: Optional[ClientAPI] = None
    collection: Optional[Collection] = None

chroma_manager = ChromaManager()


def get_chroma_client() -> ClientAPI:
    """
    Initializes and returns the persistent ChromaDB client singleton.
    """
    if chroma_manager.client is None:
        try:
            logger.info(f"Initializing ChromaDB PersistentClient at '{settings.CHROMA_PERSIST_DIR}'...")
            chroma_manager.client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
            logger.info("ChromaDB PersistentClient successfully initialized.")
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB PersistentClient: {str(e)}")
            raise RuntimeError(f"ChromaDB client initialization failure: {str(e)}") from e
    return chroma_manager.client


def get_or_create_collection() -> Collection:
    """
    Gets or creates the vector collection configured with sentence-transformers embedding function.
    """
    if chroma_manager.collection is None:
        client = get_chroma_client()
        try:
            logger.info(
                f"Getting or creating Chroma collection '{CHROMA_COLLECTION}' "
                f"using embedding model '{EMBEDDING_MODEL}'..."
            )
            sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name=EMBEDDING_MODEL
            )
            chroma_manager.collection = client.get_or_create_collection(
                name=CHROMA_COLLECTION,
                embedding_function=sentence_transformer_ef,
                metadata={"hnsw:space": "cosine"}
            )
            logger.info(f"Chroma collection '{CHROMA_COLLECTION}' ready.")
        except Exception as e:
            logger.error(f"Failed to get or create Chroma collection '{CHROMA_COLLECTION}': {str(e)}")
            raise RuntimeError(f"Chroma collection initialization failure: {str(e)}") from e
    return chroma_manager.collection
