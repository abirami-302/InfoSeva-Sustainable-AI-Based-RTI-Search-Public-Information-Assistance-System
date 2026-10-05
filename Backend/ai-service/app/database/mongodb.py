from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorCollection
from app.config.settings import settings
from app.config.constants import (
    CHAT_COLLECTION,
    DOCUMENT_COLLECTION,
    SUMMARY_COLLECTION,
    NOTIFICATION_COLLECTION,
)
from app.config.logging_config import get_logger

logger = get_logger(__name__)

class MongoDBManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

db_manager = MongoDBManager()


async def connect_to_mongodb() -> None:
    """
    Establishes an asynchronous connection to MongoDB using Motor.
    """
    if db_manager.client is not None:
        logger.info("MongoDB client is already connected.")
        return

    try:
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
        db_manager.client = AsyncIOMotorClient(settings.MONGODB_URI)
        # Default database name 'infoseva_ai'
        db_manager.db = db_manager.client.get_database("infoseva_ai")
        # Quick ping check to verify connection
        await db_manager.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB.")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}")
        db_manager.client = None
        db_manager.db = None
        raise RuntimeError(f"MongoDB connection failure: {str(e)}") from e


async def close_mongodb_connection() -> None:
    """
    Closes the MongoDB client connection.
    """
    if db_manager.client is not None:
        logger.info("Closing MongoDB connection...")
        db_manager.client.close()
        db_manager.client = None
        db_manager.db = None
        logger.info("MongoDB connection closed.")


def get_database() -> AsyncIOMotorDatabase:
    """
    Returns the active MongoDB database instance.
    """
    if db_manager.db is None:
        logger.error("Attempted to access database before MongoDB connection was initialized.")
        raise RuntimeError("Database is not initialized. Call connect_to_mongodb() first.")
    return db_manager.db


def get_chat_collection() -> AsyncIOMotorCollection:
    """
    Returns the chat history collection.
    """
    return get_database()[CHAT_COLLECTION]


def get_document_collection() -> AsyncIOMotorCollection:
    """
    Returns the metadata documents collection.
    """
    return get_database()[DOCUMENT_COLLECTION]


def get_summary_collection() -> AsyncIOMotorCollection:
    """
    Returns the summaries collection.
    """
    return get_database()[SUMMARY_COLLECTION]


def get_notification_collection() -> AsyncIOMotorCollection:
    """
    Returns the notifications collection.
    """
    return get_database()[NOTIFICATION_COLLECTION]
