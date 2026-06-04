from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, Field


class ChatMessageRequest(BaseModel):
    message: str = Field(min_length=1)
    indication_id: Optional[str] = None


class ChatHistoryMessage(BaseModel):
    role: str
    content: str
    created_at: datetime
    indication_id: Optional[str] = None
    metadata: dict[str, Any]


class ChatHistoryResponse(BaseModel):
    messages: List[ChatHistoryMessage]
