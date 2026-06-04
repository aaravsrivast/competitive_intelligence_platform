from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class PatchProfileRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=8)
    new_password: str = Field(min_length=8)


class ProfileResponse(BaseModel):
    id: str
    email: str
    role: str
    tenant_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile_photo_url: Optional[str] = None
    therapeutic_area_ids: list[str] = []
    created_at: datetime
    updated_at: datetime
