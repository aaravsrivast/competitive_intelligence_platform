from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CreateFeedbackRequest(BaseModel):
    message: str = Field(min_length=1)
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    context_type: Optional[str] = None
    context_id: Optional[str] = None


class UpdateFeedbackRequest(BaseModel):
    message: Optional[str] = None
    rating: Optional[int] = Field(default=None, ge=1, le=5)


class FeedbackResponse(BaseModel):
    id: str
    tenant_id: str
    user_id: str
    message: str
    rating: Optional[int] = None
    context_type: Optional[str] = None
    context_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class FeedbackListResponse(BaseModel):
    data: list[FeedbackResponse]
    total: int
    page: int
    limit: int
    pages: int
