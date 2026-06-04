from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class GenerateReportRequest(BaseModel):
    title: str = Field(min_length=1)
    payload: dict[str, Any] = Field(default_factory=dict)


class ReportResponse(BaseModel):
    id: str
    tenant_id: str
    title: str
    created_by_user_id: str
    pdf_storage_path: str
    payload_summary: dict[str, Any]
    created_at: datetime


class ReportListResponse(BaseModel):
    data: list[ReportResponse]
    total: int
    page: int
    limit: int
    pages: int
