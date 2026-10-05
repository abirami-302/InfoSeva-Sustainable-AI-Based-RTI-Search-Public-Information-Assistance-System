import uuid
from datetime import datetime
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.database.mongodb import get_notification_collection
from app.config.logging_config import get_logger

logger = get_logger(__name__)


class NotificationEventType(str, Enum):
    DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED"
    EMBEDDING_COMPLETED = "EMBEDDING_COMPLETED"
    EMBEDDING_FAILED = "EMBEDDING_FAILED"
    SEARCH_COMPLETED = "SEARCH_COMPLETED"
    SUMMARY_GENERATED = "SUMMARY_GENERATED"
    SUMMARY_FAILED = "SUMMARY_FAILED"
    RTI_GENERATED = "RTI_GENERATED"
    CHAT_COMPLETED = "CHAT_COMPLETED"
    UPLOAD_FAILED = "UPLOAD_FAILED"
    SYSTEM_ERROR = "SYSTEM_ERROR"


class NotificationSeverity(str, Enum):
    INFO = "INFO"
    SUCCESS = "SUCCESS"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class NotificationModel(BaseModel):
    notificationId: str
    eventType: NotificationEventType
    title: str
    message: str
    severity: NotificationSeverity
    isRead: bool = False
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    relatedDocumentId: Optional[str] = None
    conversationId: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


async def create_notification(
    event_type: NotificationEventType,
    title: str,
    message: str,
    severity: NotificationSeverity = NotificationSeverity.INFO,
    related_document_id: Optional[str] = None,
    conversation_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Optional[NotificationModel]:
    """
    Creates and persists a system notification asynchronously in MongoDB.
    Fails safely without raising exceptions to protect main business logic workflows.
    """
    try:
        notification_id = f"notif_{uuid.uuid4().hex[:12]}"
        now = datetime.utcnow()
        clean_metadata = metadata or {}

        # Strip any sensitive secrets if present in metadata keys
        sensitive_keys = {"api_key", "secret", "password", "token"}
        filtered_metadata = {
            k: v for k, v in clean_metadata.items()
            if not any(s in k.lower() for s in sensitive_keys)
        }

        notif_payload = {
            "notificationId": notification_id,
            "eventType": event_type.value if isinstance(event_type, Enum) else str(event_type),
            "title": title,
            "message": message,
            "severity": severity.value if isinstance(severity, Enum) else str(severity),
            "isRead": False,
            "createdAt": now,
            "updatedAt": now,
            "relatedDocumentId": related_document_id,
            "conversationId": conversation_id,
            "metadata": filtered_metadata
        }

        logger.info(f"Persisting notification '{notification_id}' ({event_type})...")
        collection = get_notification_collection()
        await collection.insert_one(notif_payload)
        logger.info(f"Notification '{notification_id}' persisted successfully.")

        return NotificationModel(**notif_payload)

    except Exception as e:
        # Non-blocking error handling: Log failure but do NOT disrupt calling business workflows
        logger.error(f"Failed to persist notification for event '{event_type}': {str(e)}")
        return None


async def get_notifications(
    limit: int = 50,
    skip: int = 0,
    unread_only: bool = False
) -> List[NotificationModel]:
    """
    Retrieves system notifications from MongoDB with optional unread filter and pagination.
    """
    try:
        collection = get_notification_collection()
        query = {"isRead": False} if unread_only else {}
        cursor = collection.find(query, {"_id": 0}).sort("createdAt", -1).skip(skip).limit(limit)

        notifications: List[NotificationModel] = []
        async for doc in cursor:
            notifications.append(NotificationModel(**doc))
        return notifications
    except Exception as e:
        logger.error(f"Failed to fetch notifications from MongoDB: {str(e)}")
        return []


async def mark_as_read(notification_id: str) -> bool:
    """
    Marks a specific notification as read in MongoDB.
    """
    try:
        collection = get_notification_collection()
        res = await collection.update_one(
            {"notificationId": notification_id},
            {"$set": {"isRead": True, "updatedAt": datetime.utcnow()}}
        )
        return res.modified_count > 0
    except Exception as e:
        logger.error(f"Failed to mark notification '{notification_id}' as read: {str(e)}")
        return False


async def delete_notification(notification_id: str) -> bool:
    """
    Deletes a notification record from MongoDB.
    """
    try:
        collection = get_notification_collection()
        res = await collection.delete_one({"notificationId": notification_id})
        return res.deleted_count > 0
    except Exception as e:
        logger.error(f"Failed to delete notification '{notification_id}': {str(e)}")
        return False
