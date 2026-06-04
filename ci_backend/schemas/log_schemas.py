from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class LogEntryResponse(BaseModel):
    id: str
    tenant_id: Optional[str] = None
    user_id: Optional[str] = None
    tab: str
    action: str
    document_id: Optional[str] = None
    metadata: dict[str, Any]
    created_at: datetime


class LogListResponse(BaseModel):
    data: list[LogEntryResponse]
    total: int
    page: int
    limit: int
    pages: int
