from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.config.logging_config import get_logger
from app.database.mongodb import connect_to_mongodb, close_mongodb_connection
from app.database.chroma_client import get_chroma_client, get_or_create_collection
from app.middleware.exception_handler import register_exception_handlers

from app.api import health, chat, search, summarize, rti, upload, document, suggest_category

logger = get_logger("infoseva_app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown lifespan context manager.
    Connects to MongoDB and initializes ChromaDB client upon startup.
    """
    logger.info("Initializing InfoSeva AI FastAPI Service startup sequence...")
    try:
        # Initialize async MongoDB connection
        await connect_to_mongodb()
        # Initialize ChromaDB persistent client & vector collection
        get_chroma_client()
        get_or_create_collection()
        logger.info("Database and Vector Store successfully connected & ready.")
    except Exception as e:
        logger.error(f"Startup initialization error: {str(e)}")

    yield

    logger.info("Initiating InfoSeva AI FastAPI Service shutdown sequence...")
    await close_mongodb_connection()
    logger.info("Shutdown complete.")


app = FastAPI(
    title="InfoSeva AI Service",
    description="FastAPI AI microservice providing RAG Chat, RTI Assistance, Semantic Search, and Document Summarization.",
    version="1.0.0",
    lifespan=lifespan
)

# Register Exception Middleware Handlers
register_exception_handlers(app)

# Configure CORS Middleware
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://localhost:8082",
]

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api/v1 prefix
app.include_router(health.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")
app.include_router(summarize.router, prefix="/api/v1")
app.include_router(rti.router, prefix="/api/v1")
app.include_router(upload.router, prefix="/api/v1")
app.include_router(document.router, prefix="/api/v1")
app.include_router(suggest_category.router, prefix="/api/v1")


@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "InfoSeva AI Microservice",
        "status": "running",
        "docs": "/docs"
    }
