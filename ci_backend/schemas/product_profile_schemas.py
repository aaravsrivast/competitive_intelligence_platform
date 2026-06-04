from typing import Any, List, Optional

from pydantic import BaseModel


class ProductProfileItem(BaseModel):
    id: str
    tenant_id: str
    company: str
    competitor_asset: str
    indication_id: str
    phase: str
    nct_id: Optional[str] = None
    profile_markdown: Optional[str] = None


class ProductProfileListResponse(BaseModel):
    data: list[ProductProfileItem]
    total: int
    page: int
    limit: int
    pages: int
