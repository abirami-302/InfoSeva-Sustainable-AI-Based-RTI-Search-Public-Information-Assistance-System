from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.utils.text_utils import split_text_into_chunks
from app.vectorstore.embedding_generator import embed_batch
from app.vectorstore.vector_manager import add_documents, delete_document
from app.config.logging_config import get_logger

logger = get_logger(__name__)


class EmbeddingResult(BaseModel):
    documentId: str
    chunksProcessed: int
    success: bool
    message: str


def validate_embedding_metadata(metadata: Dict[str, Any]) -> None:
    """
    Validates that all mandatory metadata fields are present and non-empty.
    Required: documentId, title, department, documentType, date, source.
    """
    required_fields = ["documentId", "title", "department", "documentType", "date", "source"]
    missing_fields = [f for f in required_fields if not metadata.get(f) or not str(metadata.get(f)).strip()]

    if missing_fields:
        error_msg = f"Missing required metadata fields for embedding: {', '.join(missing_fields)}"
        logger.error(error_msg)
        raise ValueError(error_msg)


def embed_document(text: str, metadata: Dict[str, Any]) -> EmbeddingResult:
    """
    Orchestrates validating metadata, text cleaning/chunking, generating embeddings,
    and storing vector chunks into ChromaDB.
    """
    try:
        validate_embedding_metadata(metadata)

        document_id = str(metadata["documentId"])
        chunks = split_text_into_chunks(text)

        if not chunks:
            logger.warning(f"No valid text chunks generated for documentId '{document_id}'.")
            return EmbeddingResult(
                documentId=document_id,
                chunksProcessed=0,
                success=True,
                message="Document contained no extractable text chunks to embed."
            )

        logger.info(f"Generating embeddings for {len(chunks)} chunks of documentId '{document_id}'...")
        embeddings = embed_batch(chunks)

        chunk_ids: List[str] = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
        chunk_metadatas: List[Dict[str, Any]] = []

        for i, chunk_text in enumerate(chunks):
            # NOTE FOR FUTURE RTI SEARCH / FILTERING IMPLEMENTATION:
            # Legacy ChromaDB chunks have source_type entirely ABSENT (no key), while legacy
            # Oracle records now explicitly say 'UNCLASSIFIED'.
            # When search/filtering logic is built later, it must treat both cases:
            #   1) missing key: meta.get("source_type") is None / ""
            #   2) explicit string: meta.get("source_type") == "UNCLASSIFIED"
            # as EQUIVALENT unknown provenance — not just one of them.
            chunk_meta = {
                "documentId": document_id,
                "title": str(metadata["title"]),
                "department": str(metadata["department"]),
                "documentType": str(metadata["documentType"]),
                "date": str(metadata["date"]),
                "source": str(metadata["source"]),
                "source_type": str(metadata.get("source_type") or metadata.get("sourceType") or "UNCLASSIFIED"),
                "status": str(metadata.get("status", "PENDING_REVIEW")),
                "chunkIndex": i,
                "totalChunks": len(chunks)
            }
            chunk_metadatas.append(chunk_meta)

        add_documents(
            ids=chunk_ids,
            texts=chunks,
            embeddings=embeddings,
            metadatas=chunk_metadatas
        )

        logger.info(f"Successfully embedded and stored {len(chunks)} chunks for documentId '{document_id}'.")
        return EmbeddingResult(
            documentId=document_id,
            chunksProcessed=len(chunks),
            success=True,
            message=f"Successfully generated and stored {len(chunks)} embeddings."
        )

    except Exception as e:
        doc_id = metadata.get("documentId", "UNKNOWN")
        logger.error(f"Failed to embed document '{doc_id}': {str(e)}")
        raise RuntimeError(f"Embedding pipeline failure for document '{doc_id}': {str(e)}") from e


def delete_document_embeddings(document_id: str) -> None:
    """
    Removes all embedding chunks associated with a documentId from ChromaDB.
    """
    if not document_id:
        raise ValueError("document_id is required for deletion.")

    try:
        logger.info(f"Deleting embeddings for documentId '{document_id}'...")
        delete_document(document_id)
        logger.info(f"Embeddings deleted for documentId '{document_id}'.")
    except Exception as e:
        logger.error(f"Error deleting embeddings for documentId '{document_id}': {str(e)}")
        raise RuntimeError(f"Failed to delete embeddings for document '{document_id}': {str(e)}") from e


def reembed_document(text: str, metadata: Dict[str, Any]) -> EmbeddingResult:
    """
    Re-embeds a document by first removing existing embeddings and generating fresh chunks.
    """
    document_id = metadata.get("documentId")
    if document_id:
        try:
            delete_document_embeddings(str(document_id))
        except Exception as e:
            logger.warning(f"Error purging old embeddings before re-embedding document '{document_id}': {str(e)}")

    return embed_document(text, metadata)
