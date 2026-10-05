import os
import time
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import google.generativeai as genai

from app.config.settings import settings
from app.config.constants import CHAT_COLLECTION, TOP_K_RESULTS, MAX_CONTEXT_DOCUMENTS
from app.config.logging_config import get_logger
from app.utils.validation import sanitize_text, validate_query
from app.database.mongodb import get_chat_collection
from app.services.search_service import search_documents, SearchResponse
from app.models.response_models import Citation, SearchResult

logger = get_logger(__name__)

PROMPT_TEMPLATE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "prompts",
    "assistant_prompt.txt"
)


class ChatServiceRequest(BaseModel):
    message: str = Field(..., description="User prompt or chat question")
    conversationId: Optional[str] = Field(None, description="Optional conversation session ID")
    userId: Optional[str] = Field(None, description="Optional citizen user ID")
    language: Optional[str] = Field("English", description="Preferred response language")


class ChatServiceResponse(BaseModel):
    success: bool
    conversationId: str
    title: str
    message: str
    answer: str
    citations: List[Citation] = Field(default_factory=list)
    retrievedDocumentsCount: int
    executionTimeMs: float
    timestamp: str


class GeminiChatClient:
    _configured: bool = False

    @classmethod
    def _ensure_configured(cls) -> None:
        if not cls._configured:
            api_key = settings.GEMINI_API_KEY
            if not api_key:
                logger.error("GEMINI_API_KEY is not configured in environment settings.")
                raise ValueError("Gemini API key is missing. Set GEMINI_API_KEY in .env.")
            genai.configure(api_key=api_key)
            cls._configured = True

    @classmethod
    def generate_answer(cls, prompt: str) -> str:
        cls._ensure_configured()
        candidate_models = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-flash-latest"]
        last_err = None

        for model_name in candidate_models:
            try:
                logger.info(f"Sending chat RAG prompt to Google Gemini ({model_name})...")
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)

                if not response or not response.text:
                    logger.warning(f"Gemini model {model_name} returned an empty response.")
                    continue

                return response.text.strip()
            except Exception as e:
                logger.warning(f"Gemini API error with model {model_name}: {str(e)}")
                last_err = e
                continue

        logger.error(f"All candidate Gemini models failed: {str(last_err)}")
        raise RuntimeError(f"Gemini chat response generation failed: {str(last_err)}") from last_err


def _load_prompt_template() -> str:
    if not os.path.exists(PROMPT_TEMPLATE_PATH):
        logger.error(f"Assistant prompt template not found at '{PROMPT_TEMPLATE_PATH}'.")
        raise FileNotFoundError(f"Assistant prompt template missing at '{PROMPT_TEMPLATE_PATH}'")

    try:
        with open(PROMPT_TEMPLATE_PATH, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        logger.error(f"Failed to load assistant prompt template: {str(e)}")
        raise RuntimeError(f"Error reading assistant prompt template: {str(e)}") from e


def _rewrite_query_for_retrieval(current_query: str, history: List[Dict[str, Any]]) -> str:
    """
    Private helper that checks if current user query depends on recent conversation history
    and rewrites it into a self-contained semantic retrieval query.
    """
    if not history:
        return current_query

    ambiguous_triggers = ["who", "how", "what", "where", "eligible", "apply", "cost", "fee", "it", "they", "this", "that"]
    words = [w.lower() for w in current_query.split()]

    is_short = len(words) <= 4
    has_trigger = any(w in ambiguous_triggers for w in words)

    if not (is_short or has_trigger):
        return current_query

    last_exchanges = history[-2:]
    context_keywords = []
    for msg in last_exchanges:
        msg_text = msg.get("content", "")
        for token in msg_text.split():
            if token.isupper() and len(token) >= 3 and token not in ["RTI", "PDF", "API", "THE"]:
                context_keywords.append(token)

    if context_keywords:
        topic = context_keywords[-1]
        rewritten = f"{current_query} regarding {topic}"
        logger.info(f"Contextual Query Rewriter optimized retrieval query: '{current_query}' -> '{rewritten}'")
        return rewritten

    return current_query


def _optimize_retrieved_context(
    results: List[SearchResult],
    max_context_count: int = MAX_CONTEXT_DOCUMENTS
) -> List[SearchResult]:
    """
    Optimizes context before prompt construction:
    1. Deduplicates exact snippet contents.
    2. Sorts by retrieval score (highest first).
    3. Promotes source diversity across different documents/departments.
    4. Limits total context entries to max token/document budget.
    """
    if not results:
        return []

    # Step 1: Deduplicate exact duplicate text snippets
    unique_snippets = set()
    deduped_results: List[SearchResult] = []

    for res in results:
        cleaned_snippet = res.snippet.strip().lower()
        if cleaned_snippet not in unique_snippets:
            unique_snippets.add(cleaned_snippet)
            deduped_results.append(res)

    # Step 2: Rank by retrieval score
    deduped_results.sort(key=lambda r: r.score, reverse=True)

    # Step 3: Diverse source selection (interleave documents across different documentIds)
    doc_grouped: Dict[str, List[SearchResult]] = {}
    for res in deduped_results:
        doc_grouped.setdefault(res.documentId, []).append(res)

    optimized: List[SearchResult] = []
    # Round-robin selection across unique documentIds for source diversity
    max_depth = max(len(chunks) for chunks in doc_grouped.values()) if doc_grouped else 0

    for depth in range(max_depth):
        for doc_id, chunks in doc_grouped.items():
            if depth < len(chunks):
                optimized.append(chunks[depth])
                if len(optimized) >= max_context_count:
                    break
        if len(optimized) >= max_context_count:
            break

    logger.info(
        f"Context Optimization: Reduced {len(results)} raw chunks to {len(optimized)} "
        f"diverse, deduplicated chunks."
    )
    return optimized


async def _get_or_create_conversation(conversation_id: Optional[str], initial_query: str) -> Dict[str, Any]:
    collection = get_chat_collection()
    conv_id = conversation_id or f"conv_{uuid.uuid4().hex[:12]}"

    existing = await collection.find_one({"conversationId": conv_id})
    if existing:
        return existing

    clean_title = initial_query[:35].strip() + ("..." if len(initial_query) > 35 else "")
    new_record = {
        "conversationId": conv_id,
        "title": clean_title,
        "userId": "citizen_user",
        "messages": [],
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    await collection.insert_one(new_record)
    return new_record


async def process_chat_message(request: ChatServiceRequest) -> ChatServiceResponse:
    """
    Processes RAG chat message: Loads history, rewrites ambiguous query, searches vector store,
    optimizes context (deduplication, score ranking, source diversity), calls Gemini LLM,
    attaches structured citations, and saves conversation to MongoDB.
    """
    start_time = time.time()
    logger.info("Chat message request received...")

    try:
        user_message = validate_query(request.message)
        conv_record = await _get_or_create_conversation(request.conversationId, user_message)
        conv_id = conv_record["conversationId"]
        conv_title = conv_record.get("title", "Government Info Chat")
        history = conv_record.get("messages", [])

        # Step 1: Contextual Query Rewriting for retrieval
        retrieval_query = _rewrite_query_for_retrieval(user_message, history)

        # Step 2: Semantic retrieval via SearchService
        logger.info(f"Executing semantic vector search for retrieval query: '{retrieval_query[:50]}...'")
        search_res: SearchResponse = search_documents(query=retrieval_query, top_k=TOP_K_RESULTS * 2)

        # Step 3: Context Optimization (Deduplication, Score Ranking, Source Diversity, Token Budget)
        optimized_results = _optimize_retrieved_context(search_res.results, max_context_count=MAX_CONTEXT_DOCUMENTS)

        # Step 4: Context building
        context_docs_str = "\n\n".join(
            [f"--- Document ({r.title} | {r.department}) ---\n{r.snippet}" for r in optimized_results]
        ) if optimized_results else "No relevant public documents were found."

        history_str = "\n".join(
            [f"{m['role'].capitalize()}: {m['content']}" for m in history[-4:]]
        ) if history else "None"

        # Step 5: Prompt template construction
        template = _load_prompt_template()
        full_prompt = template.format(
            context_documents=context_docs_str,
            conversation_history=history_str,
            user_question=user_message
        )

        # Step 6: Call Gemini 2.0 Flash
        logger.info("Calling Gemini 2.0 Flash for RAG chat generation...")
        generated_answer = GeminiChatClient.generate_answer(full_prompt)

        # Step 7: Update MongoDB chat history
        now = datetime.utcnow()
        user_entry = {"role": "user", "content": user_message, "timestamp": now}
        assistant_entry = {
            "role": "assistant",
            "content": generated_answer,
            "citations": [c.model_dump() for c in search_res.citations],
            "timestamp": now
        }

        chat_collection = get_chat_collection()
        await chat_collection.update_one(
            {"conversationId": conv_id},
            {
                "$push": {"messages": {"$each": [user_entry, assistant_entry]}},
                "$set": {"updatedAt": now}
            }
        )

        duration_ms = round((time.time() - start_time) * 1000, 2)
        logger.info(f"Chat request completed in {duration_ms}ms for conversationId '{conv_id}'.")

        return ChatServiceResponse(
            success=True,
            conversationId=conv_id,
            title=conv_title,
            message="Chat message processed successfully.",
            answer=generated_answer,
            citations=search_res.citations,
            retrievedDocumentsCount=len(optimized_results),
            executionTimeMs=duration_ms,
            timestamp=now.isoformat()
        )

    except Exception as e:
        duration_ms = round((time.time() - start_time) * 1000, 2)
        logger.error(f"Chat Service process failure: {str(e)}")
        raise RuntimeError(f"Chat service error: {str(e)}") from e
