# Model & Vector Constants
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 100
TOP_K_RESULTS = 5
SIMILARITY_THRESHOLD = 0.55
MAX_CONTEXT_DOCUMENTS = 5
MAX_SUMMARY_TOKENS = 1024

# Database Collections (MongoDB)
DOCUMENT_COLLECTION = "documents"
CHAT_COLLECTION = "chat_history"
SUMMARY_COLLECTION = "summaries"
NOTIFICATION_COLLECTION = "notifications"

# Vector Store Collection (ChromaDB)
CHROMA_COLLECTION = "infoseva_embeddings"
