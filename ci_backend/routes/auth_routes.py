from datetime import timedelta

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse

from config import get_settings
from schemas.auth_schemas import LoginRequest, RefreshRequest, TokenResponse
from utils.jwt_utils import create_access_token, create_refresh_token, decode_token
from utils.password_utils import verify_password
from models.user_model import UserModel

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
async def login(body: LoginRequest) -> JSONResponse:
    user = await UserModel.get_by_email(body.email)
    if not user or not user.get("active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    role = user["role"]
    tenant_id = str(user["tenant_id"]) if user.get("tenant_id") else None
    user_id = str(user["_id"])
    settings = get_settings()
    access = create_access_token(
        user_id,
        tenant_id,
        role,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh = create_refresh_token(user_id, tenant_id, role)
    if role == "superadmin":
        redirect_hint = "/superadmin/dashboard"
    else:
        redirect_hint = "/app/home"
    payload = TokenResponse(
        access_token=access,
        refresh_token=refresh,
        redirect_hint=redirect_hint,
        role=role,
        tenant_id=tenant_id,
        user_id=user_id,
    )
    return JSONResponse(
        content={"success": True, "message": "OK", "code": "ok", "data": payload.model_dump()}
    )


@router.post("/refresh")
async def refresh(body: RefreshRequest) -> JSONResponse:
    raw = decode_token(body.refresh_token)
    if raw.typ != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    settings = get_settings()
    access = create_access_token(
        raw.sub,
        raw.tenant_id,
        raw.role,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh_tok = create_refresh_token(raw.sub, raw.tenant_id, raw.role)
    role = raw.role
    if role == "superadmin":
        redirect_hint = "/superadmin/dashboard"
    else:
        redirect_hint = "/app/home"
    payload = TokenResponse(
        access_token=access,
        refresh_token=refresh_tok,
        redirect_hint=redirect_hint,
        role=role,
        tenant_id=raw.tenant_id,
        user_id=raw.sub,
    )
    return JSONResponse(
        content={"success": True, "message": "OK", "code": "ok", "data": payload.model_dump()}
    )
