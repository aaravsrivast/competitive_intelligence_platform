from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class ClinicalTrialResponse(BaseModel):
    id: str
    tenant_id: str
    nct_id: str
    payload: dict[str, Any]
    synced_at: datetime
    created_at: datetime
    updated_at: datetime


class ClinicalTrialListResponse(BaseModel):
    data: list[ClinicalTrialResponse]
    total: int
    page: int
    limit: int
    pages: int
