from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class CreateCompetitiveLandscapeRequest(BaseModel):
    company: str = Field(min_length=1)
    competitor_asset: str = Field(min_length=1)
    indication_id: str
    phase: str = Field(min_length=1)
    roa: Optional[str] = None
    moa: Optional[str] = None
    dosing: Optional[str] = None
    line_of_therapy: Optional[str] = None
    notes: Optional[str] = None
    sub_indication: Optional[str] = None
    formulation: Optional[str] = None
    target_population: Optional[str] = None
    study_name: Optional[str] = None
    nct_id: Optional[str] = None
    timeline: Optional[dict[str, Any]] = None
    priority: Optional[str] = None


class UpdateCompetitiveLandscapeRequest(BaseModel):
    company: Optional[str] = None
    competitor_asset: Optional[str] = None
    indication_id: Optional[str] = None
    phase: Optional[str] = None
    roa: Optional[str] = None
    moa: Optional[str] = None
    dosing: Optional[str] = None
    line_of_therapy: Optional[str] = None
    notes: Optional[str] = None
    sub_indication: Optional[str] = None
    formulation: Optional[str] = None
    target_population: Optional[str] = None
    study_name: Optional[str] = None
    nct_id: Optional[str] = None
    timeline: Optional[dict[str, Any]] = None
    priority: Optional[str] = None
    product_profile: Optional[str] = None


class UpdatePhaseRequest(BaseModel):
    phase: str = Field(min_length=1)


class CompetitiveLandscapeResponse(BaseModel):
    id: str
    tenant_id: str
    company: str
    competitor_asset: str
    roa: Optional[str] = None
    moa: Optional[str] = None
    phase: str
    dosing: Optional[str] = None
    line_of_therapy: Optional[str] = None
    notes: Optional[str] = None
    sub_indication: Optional[str] = None
    formulation: Optional[str] = None
    target_population: Optional[str] = None
    study_name: Optional[str] = None
    nct_id: Optional[str] = None
    timeline: dict[str, Any]
    priority: Optional[str] = None
    indication_id: str
    product_profile: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CompetitiveLandscapeListResponse(BaseModel):
    data: list[CompetitiveLandscapeResponse]
    total: int
    page: int
    limit: int
    pages: int


class KanbanResponse(BaseModel):
    phases: Dict[str, List[CompetitiveLandscapeResponse]]
