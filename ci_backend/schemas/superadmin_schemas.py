from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class AssignTenantAdminRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
