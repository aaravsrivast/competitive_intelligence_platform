from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    role: str = Field(pattern=r"^(admin|user)$")
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    therapeutic_area_ids: Optional[List[str]] = None


class UpdateUserRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    active: Optional[bool] = None


class UpdateRoleRequest(BaseModel):
    role: str = Field(pattern=r"^(admin|user)$")


class AssignTherapeuticAreasRequest(BaseModel):
    therapeutic_area_ids: List[str]


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    tenant_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    therapeutic_area_ids: List[str] = []
    active: bool
    profile_photo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class UserListResponse(BaseModel):
    data: list[UserResponse]
    total: int
    page: int
    limit: int
    pages: int
