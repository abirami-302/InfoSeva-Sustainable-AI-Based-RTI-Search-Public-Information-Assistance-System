from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ChatMessageModel(BaseModel):
    role: str = Field(..., description="Role of message sender (user / assistant / system)")
    content: str = Field(..., description="Message text content")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of message creation")


class ChatConversationModel(BaseModel):
    conversationId: str = Field(..., description="Unique conversation session identifier")
    userId: Optional[str] = Field(None, description="User ID owning the conversation")
    messages: List[ChatMessageModel] = Field(default_factory=list, description="Ordered list of conversation messages")
    createdAt: datetime = Field(default_factory=datetime.utcnow, description="Session creation timestamp")
    updatedAt: datetime = Field(default_factory=datetime.utcnow, description="Session last updated timestamp")
