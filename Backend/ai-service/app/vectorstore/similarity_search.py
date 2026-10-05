from typing import List
from app.config.constants import TOP_K_RESULTS, SIMILARITY_THRESHOLD
from app.database.chroma_client import get_or_create_collection
from app.vectorstore.embedding_generator import embed_text
from app.models.search_model import SearchResultModel
from app.config.logging_config import get_logger

logger = get_logger(__name__)


def search_similar_documents(
    query: str,
    top_k: int = TOP_K_RESULTS,
    is_manager: bool = False,
    min_score: float = 0.35
) -> List[SearchResultModel]:
    """
    Performs semantic vector search against ChromaDB using query embeddings.
    Returns ranked SearchResultModel list sorted by similarity.
    """
    if not query or not query.strip():
        return []

    try:
        logger.info(f"Generating query embedding for search: '{query[:50]}...'")
        query_embedding = embed_text(query)

        collection = get_or_create_collection()
        logger.info(f"Querying ChromaDB for top {top_k} similar documents...")

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )

        search_results: List[SearchResultModel] = []

        if not results or not results.get("ids") or not results["ids"][0]:
            logger.info("No matching document chunks found in vector search.")
            return []

        ids = results["ids"][0]
        documents = results["documents"][0] if results.get("documents") else []
        metadatas = results["metadatas"][0] if results.get("metadatas") else []
        distances = results["distances"][0] if results.get("distances") else []

        effective_threshold = min_score if min_score is not None else SIMILARITY_THRESHOLD

        for idx in range(len(ids)):
            meta = metadatas[idx] if idx < len(metadatas) and metadatas[idx] else {}
            dist = distances[idx] if idx < len(distances) else 1.0
            doc_text = documents[idx] if idx < len(documents) else ""

            # Cosine distance to similarity score conversion (Chroma uses cosine distance: dist = 1 - similarity)
            similarity_score = round(max(0.0, 1.0 - float(dist)), 4)

            # Apply similarity threshold filter
            if similarity_score < effective_threshold:
                continue

            # Publication Gate: Non-manager citizens can retrieve ACTIVE, APPROVED, COMPLETED, or PENDING_REVIEW documents
            # (infoseva-service subsequently enforces Oracle review status permissions)
            doc_status = str(meta.get("status", "")).strip().upper()
            if not is_manager and doc_status and doc_status not in ("ACTIVE", "APPROVED", "COMPLETED", "PENDING_REVIEW"):
                continue

            # NOTE FOR FUTURE RTI SEARCH / FILTERING IMPLEMENTATION:
            # Legacy ChromaDB chunks have source_type entirely ABSENT (no key), while legacy
            # Oracle records now explicitly say 'UNCLASSIFIED'.
            # When search/filtering logic is built later, it must treat both cases:
            #   1) missing key: meta.get("source_type") is None / ""
            #   2) explicit string: meta.get("source_type") == "UNCLASSIFIED"
            # as EQUIVALENT unknown provenance — not just one of them.
            document_id = str(meta.get("documentId", ids[idx]))

            result_model = SearchResultModel(
                documentId=document_id,
                score=similarity_score,
                chunkText=doc_text,
                metadata={
                    "title": meta.get("title", "Untitled Document"),
                    "department": meta.get("department", "General"),
                    "date": meta.get("date", "N/A"),
                    "documentType": meta.get("documentType", "General"),
                    "source": meta.get("source", "ChromaDB"),
                    "source_type": meta.get("source_type") or "UNCLASSIFIED",
                    **meta
                }
            )
            search_results.append(result_model)

        # Sort results descending by score
        search_results.sort(key=lambda r: r.score, reverse=True)
        logger.info(f"Retrieved {len(search_results)} relevant document chunks meeting threshold {SIMILARITY_THRESHOLD}.")

        return search_results

    except Exception as e:
        logger.error(f"Error performing similarity search: {str(e)}")
        raise RuntimeError(f"Vector similarity search failure: {str(e)}") from e
