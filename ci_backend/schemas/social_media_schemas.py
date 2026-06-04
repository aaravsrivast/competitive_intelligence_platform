from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class CreateSocialMediaPostRequest(BaseModel):
    title: str = Field(min_length=1)
    content: str = Field(min_length=1)
    platform: Optional[str] = None
    source_url: Optional[str] = None
    company: Optional[str] = None
    priority: Optional[str] = None
    posted_at: Optional[datetime] = None
    metadata: Optional[dict[str, Any]] = None


class UpdateSocialMediaPostRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    platform: Optional[str] = None
    source_url: Optional[str] = None
    company: Optional[str] = None
    priority: Optional[str] = None
    posted_at: Optional[datetime] = None
    metadata: Optional[dict[str, Any]] = None


class SocialMediaPostResponse(BaseModel):
    id: str
    tenant_id: str
    title: str
    content: str
    platform: Optional[str] = None
    source_url: Optional[str] = None
    company: Optional[str] = None
    priority: Optional[str] = None
    posted_at: datetime
    highlights: Optional[str] = None
    metadata: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class SocialMediaPostListResponse(BaseModel):
    data: list[SocialMediaPostResponse]
    total: int
    page: int
    limit: int
    pages: int
