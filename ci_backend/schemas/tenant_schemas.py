from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class CreateTenantRequest(BaseModel):
    name: str = Field(min_length=1)
    slug: str = Field(min_length=2, pattern=r"^[a-z0-9-]+$")
    settings: Optional[dict[str, Any]] = None


class UpdateTenantRequest(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    settings: Optional[dict[str, Any]] = None


class TenantResponse(BaseModel):
    id: str
    name: str
    slug: str
    settings: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class TenantListResponse(BaseModel):
    data: list[TenantResponse]
    total: int
    page: int
    limit: int
    pages: int


class TenantSettingsResponse(BaseModel):
    tenant_id: str
    name: str
    settings: dict[str, Any]


class PatchTenantSettingsRequest(BaseModel):
    settings: dict[str, Any]
