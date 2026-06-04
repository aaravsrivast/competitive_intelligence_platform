from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CreateNoteRequest(BaseModel):
    body: str = Field(min_length=1)
    context_type: Optional[str] = None
    context_id: Optional[str] = None


class UpdateNoteRequest(BaseModel):
    body: str = Field(min_length=1)


class NoteResponse(BaseModel):
    id: str
    tenant_id: str
    user_id: str
    body: str
    context_type: Optional[str] = None
    context_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class NoteListResponse(BaseModel):
    data: list[NoteResponse]
    total: int
    page: int
    limit: int
    pages: int
