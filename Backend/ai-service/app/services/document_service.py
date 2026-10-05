from datetime import datetime
from typing import List, Dict, Any, Optional
from app.database.mongodb import get_document_collection
from app.models.document_model import DocumentModel
from app.services.embedding_service import delete_document_embeddings
from app.config.logging_config import get_logger

logger = get_logger(__name__)


async def create_document(document_data: Dict[str, Any]) -> DocumentModel:
    """
    Creates and stores a government document metadata record in MongoDB.
    """
    required_keys = ["documentId", "title", "department", "documentType"]
    missing = [k for k in required_keys if not document_data.get(k)]
    if missing:
        raise ValueError(f"Missing required document fields: {', '.join(missing)}")

    document_id = str(document_data["documentId"])
    collection = get_document_collection()

    existing = await collection.find_one({"documentId": document_id})
    if existing:
        raise ValueError(f"Document with ID '{document_id}' already exists.")

    now = datetime.utcnow()
    doc_payload = {
        "documentId": document_id,
        "title": document_data["title"],
        "department": document_data["department"],
        "documentType": document_data["documentType"],
        "source_type": document_data.get("source_type") or document_data.get("sourceType") or "UNCLASSIFIED",
        "uploadDate": document_data.get("uploadDate", now),
        "sourceFile": document_data.get("sourceFile", ""),
        "status": document_data.get("status", "ACTIVE"),
        "summary": document_data.get("summary", None),
        "metadata": document_data.get("metadata", {})
    }

    try:
        logger.info(f"Inserting document metadata record '{document_id}' into MongoDB...")
        await collection.insert_one(doc_payload)
        logger.info(f"Successfully created document record '{document_id}'.")
        return DocumentModel(**doc_payload)
    except Exception as e:
        logger.error(f"Failed to create document record '{document_id}' in MongoDB: {str(e)}")
        raise RuntimeError(f"Database insertion failed for document '{document_id}': {str(e)}") from e


async def get_document(document_id: str) -> Optional[DocumentModel]:
    """
    Retrieves document metadata record by documentId.
    """
    if not document_id:
        raise ValueError("document_id parameter is required.")

    collection = get_document_collection()
    doc_data = await collection.find_one({"documentId": document_id}, {"_id": 0})
    if not doc_data:
        return None

    return DocumentModel(**doc_data)


async def get_all_documents(limit: int = 100, skip: int = 0) -> List[DocumentModel]:
    """
    Retrieves list of document metadata records with pagination.
    """
    collection = get_document_collection()
    cursor = collection.find({}, {"_id": 0}).skip(skip).limit(limit)
    documents: List[DocumentModel] = []
    async for doc_data in cursor:
        documents.append(DocumentModel(**doc_data))
    return documents


async def update_document(document_id: str, update_data: Dict[str, Any]) -> Optional[DocumentModel]:
    """
    Updates document metadata record in MongoDB.
    """
    if not document_id:
        raise ValueError("document_id parameter is required.")

    collection = get_document_collection()
    update_data.pop("_id", None)
    update_data.pop("documentId", None)

    try:
        logger.info(f"Updating document metadata for '{document_id}'...")
        result = await collection.find_one_and_update(
            {"documentId": document_id},
            {"$set": update_data},
            return_document=True,
            projection={"_id": 0}
        )
        if not result:
            logger.warning(f"Document '{document_id}' not found for update.")
            return None

        return DocumentModel(**result)
    except Exception as e:
        logger.error(f"Failed to update document '{document_id}': {str(e)}")
        raise RuntimeError(f"Database update failed for document '{document_id}': {str(e)}") from e


async def update_document_status(document_id: str, new_status: str) -> Optional[DocumentModel]:
    """
    Updates document approval status in MongoDB and updates all associated vector chunk metadatas in ChromaDB.
    """
    if not document_id:
        raise ValueError("document_id parameter is required.")

    collection = get_document_collection()
    new_status = new_status.upper()

    try:
        logger.info(f"Updating approval status for '{document_id}' to '{new_status}' in MongoDB...")
        result = await collection.find_one_and_update(
            {"documentId": document_id},
            {"$set": {"status": new_status, "updatedAt": datetime.utcnow()}},
            return_document=True,
            projection={"_id": 0}
        )
        
        # Update ChromaDB chunk metadatas
        try:
            from app.database.chroma_client import get_or_create_collection
            chroma_col = get_or_create_collection()
            # Fetch all chunks with this documentId
            matching = chroma_col.get(where={"documentId": document_id})
            if matching and matching.get("ids"):
                chunk_ids = matching["ids"]
                metadatas = matching.get("metadatas", [])
                updated_metadatas = []
                for m in metadatas:
                    m_copy = dict(m) if m else {}
                    m_copy["status"] = new_status
                    updated_metadatas.append(m_copy)
                
                chroma_col.update(
                    ids=chunk_ids,
                    metadatas=updated_metadatas
                )
                logger.info(f"Updated {len(chunk_ids)} ChromaDB vector chunks to status '{new_status}' for documentId '{document_id}'.")
        except Exception as chroma_err:
            logger.error(f"Failed to update ChromaDB status for '{document_id}': {str(chroma_err)}")

        if not result:
            logger.warning(f"Document '{document_id}' not found in MongoDB for status update.")
            return None

        return DocumentModel(**result)
    except Exception as e:
        logger.error(f"Failed to update status for document '{document_id}': {str(e)}")
        raise RuntimeError(f"Status update failed for document '{document_id}': {str(e)}") from e


async def delete_document(document_id: str) -> bool:
    """
    Deletes document metadata from MongoDB and purges associated vector embeddings from ChromaDB.
    """
    if not document_id:
        raise ValueError("document_id parameter is required.")

    collection = get_document_collection()

    try:
        logger.info(f"Deleting document record '{document_id}' from MongoDB...")
        res = await collection.delete_one({"documentId": document_id})
        if res.deleted_count == 0:
            logger.warning(f"Document '{document_id}' not found in MongoDB.")
            return False

        logger.info(f"Purging associated embeddings for document '{document_id}'...")
        try:
            delete_document_embeddings(document_id)
        except Exception as embed_err:
            logger.error(f"Failed to purge ChromaDB embeddings for deleted document '{document_id}': {str(embed_err)}")

        return True
    except Exception as e:
        logger.error(f"Failed to delete document '{document_id}': {str(e)}")
        raise RuntimeError(f"Document deletion process failed: {str(e)}") from e
