from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class CreateTherapeuticAreaRequest(BaseModel):
    name: str = Field(min_length=1)
    description: Optional[str] = None


class UpdateTherapeuticAreaRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class CreateIndicationRequest(BaseModel):
    name: str = Field(min_length=1)
    code: Optional[str] = None
    description: Optional[str] = None


class TherapeuticAreaResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class TherapeuticAreaListResponse(BaseModel):
    data: list[TherapeuticAreaResponse]
    total: int
    page: int
    limit: int
    pages: int


class IndicationResponse(BaseModel):
    id: str
    tenant_id: str
    therapeutic_area_id: str
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
