from typing import List, Optional
from pydantic import BaseModel, Field


class Citation(BaseModel):
    documentId: str = Field(..., description="Unique ID of the cited document")
    title: str = Field(..., description="Title of the cited document")
    department: str = Field(..., description="Department responsible for the document")
    date: str = Field(..., description="Document date or publication date")


class ChatResponse(BaseModel):
    answer: str = Field(..., description="AI generated answer response")
    citations: List[Citation] = Field(default_factory=list, description="Document citations used for generating the answer")


class SearchResult(BaseModel):
    documentId: str = Field(..., description="Document ID")
    title: str = Field(..., description="Document title")
    department: str = Field(..., description="Government department")
    date: str = Field(..., description="Document date")
    score: float = Field(..., description="Similarity confidence score")
    snippet: str = Field(..., description="Relevant text chunk snippet")
    sourceType: Optional[str] = Field("UNCLASSIFIED", description="Trust classification (GOVERNMENT_VERIFIED, COMMUNITY_SOURCED, UNCLASSIFIED)")


class SummaryResponse(BaseModel):
    summary: str = Field(..., description="Generated summary text")
    title: Optional[str] = Field(None, description="Detected document title")
    pages: Optional[int] = Field(None, description="Approximate page count")
    highlights: Optional[List[str]] = Field(default_factory=list, description="Key highlights extracted from document")
    simplified: Optional[str] = Field(None, description="Plain language explanation for common citizens")
    dates: Optional[List[str]] = Field(default_factory=list, description="Important dates mentioned in document")
    departments: Optional[List[str]] = Field(default_factory=list, description="Government departments referenced")
    contacts: Optional[List[str]] = Field(default_factory=list, description="Contact details found in document")


class RTIDraftResponse(BaseModel):
    draft: str = Field(..., description="Generated RTI application draft text")
