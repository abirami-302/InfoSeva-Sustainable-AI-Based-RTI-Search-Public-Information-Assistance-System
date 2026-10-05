from typing import Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., description="User chat message or query")
    conversationId: Optional[str] = Field(None, description="Optional active conversation session ID")
    userId: Optional[str] = Field(None, description="Optional user ID for context tracking")


class SearchRequest(BaseModel):
    query: str = Field(..., description="Search query string for semantic vector matching")
    topK: Optional[int] = Field(None, description="Optional limit on top K retrieved documents")
    isManager: Optional[bool] = Field(False, description="Whether search is performed by Data Manager (bypasses publication status gate)")
    minScore: Optional[float] = Field(None, description="Optional custom minimum similarity score threshold")


class SummarizeRequest(BaseModel):
    documentId: Optional[str] = Field(None, description="Optional unique document ID to summarize")
    text: Optional[str] = Field(None, description="Optional raw text content to summarize")


class RTIDraftRequest(BaseModel):
    topic: str = Field(..., description="Subject matter or core question for the RTI application")
    department: str = Field(..., description="Target government department or authority")
    applicantName: Optional[str] = Field(None, description="Optional applicant full name for template header")


class UploadRequest(BaseModel):
    title: str = Field(..., description="Official title of the document")
    department: str = Field(..., description="Government department associated with the document")
    documentType: str = Field(..., description="Classification type (e.g., Act, Policy, Circular)")
    documentDate: str = Field(..., description="Date of document issuance or publication")
