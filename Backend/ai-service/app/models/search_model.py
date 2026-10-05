from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class SearchResultModel(BaseModel):
    documentId: str = Field(..., description="Unique document identifier associated with chunk")
    score: float = Field(..., description="Vector search similarity or distance score")
    chunkText: str = Field(..., description="Extracted text chunk content")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadata payload stored with embedding")
