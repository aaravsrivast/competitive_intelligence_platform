from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, File, UploadFile
from fastapi.responses import JSONResponse

from models.user_model import UserModel
from routes.deps import require_tenant_roles, tenant_id
from schemas.profile_schemas import ChangePasswordRequest, PatchProfileRequest, ProfileResponse
from services.file_service import upload_profile_photo
from utils.jwt_utils import CurrentUser
from utils.log_utils import schedule_audit_log
from utils.password_utils import verify_password
from utils.response_utils import error_response, success_response
from utils.serializers import user_doc

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("")
async def get_profile(
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    doc = await UserModel.get_by_id(user.user_id, tid)
    if not doc:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="profile",
        action="get",
    )
    u = user_doc(doc)
    payload = ProfileResponse(
        id=u["id"],
        email=u["email"],
        role=u["role"],
        tenant_id=u.get("tenant_id"),
        first_name=u.get("first_name"),
        last_name=u.get("last_name"),
        profile_photo_url=u.get("profile_photo_url"),
        therapeutic_area_ids=u.get("therapeutic_area_ids") or [],
        created_at=u["created_at"],
        updated_at=u["updated_at"],
    )
    return success_response(data=payload.model_dump())


@router.patch("")
async def patch_profile(
    background_tasks: BackgroundTasks,
    body: PatchProfileRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    ok = await UserModel.update_profile(
        user.user_id,
        tid,
        first_name=body.first_name,
        last_name=body.last_name,
    )
    if not ok:
        return error_response("Update failed", code="error", status_code=400)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="profile",
        action="patch",
    )
    doc = await UserModel.get_by_id(user.user_id, tid)
    u = user_doc(doc) if doc else {}
    payload = ProfileResponse(
        id=u["id"],
        email=u["email"],
        role=u["role"],
        tenant_id=u.get("tenant_id"),
        first_name=u.get("first_name"),
        last_name=u.get("last_name"),
        profile_photo_url=u.get("profile_photo_url"),
        therapeutic_area_ids=u.get("therapeutic_area_ids") or [],
        created_at=u["created_at"],
        updated_at=u["updated_at"],
    )
    return success_response(data=payload.model_dump())


@router.patch("/password")
async def patch_password(
    background_tasks: BackgroundTasks,
    body: ChangePasswordRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    doc = await UserModel.get_by_id(user.user_id, tid)
    if not doc:
        return error_response("Not found", code="not_found", status_code=404)
    if not verify_password(body.current_password, doc["password_hash"]):
        return error_response("Invalid current password", code="auth", status_code=400)
    await UserModel.change_password(user.user_id, tid, body.new_password)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="profile",
        action="password_change",
    )
    return success_response(message="Password updated")


@router.post("/upload-photo")
async def upload_photo(
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
    file: UploadFile = File(...),
) -> JSONResponse:
    tid = tenant_id(user)
    try:
        url = await upload_profile_photo(file)
    except ValueError as exc:
        return error_response(str(exc), code="validation", status_code=400)
    await UserModel.update_profile(user.user_id, tid, profile_photo_url=url)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="profile",
        action="upload_photo",
    )
    return success_response(data={"profile_photo_url": url})
