from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class DocumentModel(BaseModel):
    documentId: str = Field(..., description="Unique document identifier")
    title: str = Field(..., description="Title of the document")
    department: str = Field(..., description="Associated government department")
    documentType: str = Field(..., description="Document type classification")
    source_type: Optional[str] = Field("UNCLASSIFIED", description="Trust classification: GOVERNMENT_VERIFIED, COMMUNITY_SOURCED, UNCLASSIFIED")
    uploadDate: datetime = Field(default_factory=datetime.utcnow, description="Timestamp when uploaded")
    sourceFile: Optional[str] = Field(None, description="Filename or relative storage path of source document")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional document key-value metadata")
