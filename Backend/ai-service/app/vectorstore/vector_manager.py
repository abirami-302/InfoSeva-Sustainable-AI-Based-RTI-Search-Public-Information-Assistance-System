from typing import List, Dict, Any, Optional
from app.database.chroma_client import get_or_create_collection
from app.config.logging_config import get_logger

logger = get_logger(__name__)


def add_documents(
    ids: List[str],
    texts: List[str],
    embeddings: List[List[float]],
    metadatas: List[Dict[str, Any]]
) -> None:
    """
    Inserts or updates document chunks into ChromaDB collection.
    Metadata elements should include documentId, title, department, documentType, date, source.
    """
    if not ids or not texts or not embeddings or not metadatas:
        raise ValueError("ids, texts, embeddings, and metadatas lists cannot be empty.")

    if not (len(ids) == len(texts) == len(embeddings) == len(metadatas)):
        raise ValueError("Mismatch in length between ids, texts, embeddings, and metadatas.")

    try:
        collection = get_or_create_collection()
        logger.info(f"Adding {len(ids)} document chunks to ChromaDB...")
        collection.add(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas
        )
        logger.info(f"Successfully added {len(ids)} document chunks to ChromaDB.")
    except Exception as e:
        logger.error(f"Error adding documents to ChromaDB: {str(e)}")
        raise RuntimeError(f"Failed to add documents to vector store: {str(e)}") from e


def update_document(
    id: str,
    text: Optional[str] = None,
    embedding: Optional[List[float]] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> None:
    """
    Updates a document chunk in ChromaDB collection.
    """
    try:
        collection = get_or_create_collection()
        update_kwargs: Dict[str, Any] = {"ids": [id]}

        if text is not None:
            update_kwargs["documents"] = [text]
        if embedding is not None:
            update_kwargs["embeddings"] = [embedding]
        if metadata is not None:
            update_kwargs["metadatas"] = [metadata]

        logger.info(f"Updating document chunk '{id}' in ChromaDB...")
        collection.update(**update_kwargs)
        logger.info(f"Document chunk '{id}' successfully updated.")
    except Exception as e:
        logger.error(f"Error updating document '{id}' in ChromaDB: {str(e)}")
        raise RuntimeError(f"Failed to update document in vector store: {str(e)}") from e


def delete_document(id: str) -> None:
    """
    Deletes a specific document chunk from ChromaDB by ID.
    """
    try:
        collection = get_or_create_collection()
        logger.info(f"Deleting document chunk '{id}' from ChromaDB...")
        collection.delete(ids=[id])
        logger.info(f"Document chunk '{id}' successfully deleted.")
    except Exception as e:
        logger.error(f"Error deleting document '{id}' from ChromaDB: {str(e)}")
        raise RuntimeError(f"Failed to delete document from vector store: {str(e)}") from e


def delete_all_documents() -> None:
    """
    Deletes all document chunks from ChromaDB collection.
    """
    try:
        collection = get_or_create_collection()
        count = collection.count()
        if count > 0:
            logger.info(f"Deleting all {count} documents from ChromaDB collection...")
            existing_ids = collection.get()["ids"]
            if existing_ids:
                collection.delete(ids=existing_ids)
            logger.info("All documents successfully deleted from ChromaDB.")
    except Exception as e:
        logger.error(f"Error deleting all documents from ChromaDB: {str(e)}")
        raise RuntimeError(f"Failed to clear vector store: {str(e)}") from e


def count_documents() -> int:
    """
    Returns the total number of document chunks currently in ChromaDB.
    """
    try:
        collection = get_or_create_collection()
        return collection.count()
    except Exception as e:
        logger.error(f"Error counting documents in ChromaDB: {str(e)}")
        raise RuntimeError(f"Failed to count documents in vector store: {str(e)}") from e
