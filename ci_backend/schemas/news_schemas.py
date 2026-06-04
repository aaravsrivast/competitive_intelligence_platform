from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class CreateNewsRequest(BaseModel):
    title: str = Field(min_length=1)
    content: str = Field(min_length=1)
    source_url: Optional[str] = None
    company: Optional[str] = None
    priority: Optional[str] = None
    published_at: Optional[datetime] = None
    metadata: Optional[dict[str, Any]] = None


class UpdateNewsRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    source_url: Optional[str] = None
    company: Optional[str] = None
    priority: Optional[str] = None
    published_at: Optional[datetime] = None
    metadata: Optional[dict[str, Any]] = None


class NewsResponse(BaseModel):
    id: str
    tenant_id: str
    title: str
    content: str
    source_url: Optional[str] = None
    company: Optional[str] = None
    priority: Optional[str] = None
    published_at: datetime
    highlights: Optional[str] = None
    metadata: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class NewsListResponse(BaseModel):
    data: list[NewsResponse]
    total: int
    page: int
    limit: int
    pages: int
