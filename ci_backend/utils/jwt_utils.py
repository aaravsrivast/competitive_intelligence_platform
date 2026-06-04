from datetime import datetime, timedelta, timezone
from typing import Annotated, Any, List, Optional, Union

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from config import get_settings


class TokenPayload(BaseModel):
    sub: str
    tenant_id: Optional[str] = None
    role: str
    typ: str = "access"


class CurrentUser(BaseModel):
    user_id: str
    tenant_id: Optional[str] = None
    role: str


security = HTTPBearer(auto_error=False)


def create_access_token(
    subject: str,
    tenant_id: Optional[str],
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta
        else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload: dict[str, Any] = {
        "sub": subject,
        "tenant_id": tenant_id,
        "role": role,
        "exp": expire,
        "typ": "access",
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def create_refresh_token(
    subject: str,
    tenant_id: Optional[str],
    role: str,
) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload: dict[str, Any] = {
        "sub": subject,
        "tenant_id": tenant_id,
        "role": role,
        "exp": expire,
        "typ": "refresh",
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> TokenPayload:
    settings = get_settings()
    try:
        raw = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        return TokenPayload(
            sub=str(raw["sub"]),
            tenant_id=raw.get("tenant_id"),
            role=str(raw["role"]),
            typ=str(raw.get("typ", "access")),
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc


async def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
) -> CurrentUser:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    payload = decode_token(credentials.credentials)
    if payload.typ != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )
    return CurrentUser(
        user_id=payload.sub,
        tenant_id=payload.tenant_id,
        role=payload.role,
    )


def role_required(
    allowed: Union[str, List[str]],
):
    allowed_list: List[str] = [allowed] if isinstance(allowed, str) else list(allowed)

    async def _dep(user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
        if user.role not in allowed_list:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return _dep
