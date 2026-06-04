from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from fastapi.responses import JSONResponse

from models.user_model import UserModel
from routes.deps import require_tenant_roles, tenant_id
from schemas.user_schemas import (
    AssignTherapeuticAreasRequest,
    CreateUserRequest,
    UpdateRoleRequest,
    UpdateUserRequest,
)
from utils.jwt_utils import CurrentUser
from utils.log_utils import schedule_audit_log
from utils.response_utils import error_response, paginated_success_response, success_response
from utils.serializers import map_list, user_doc

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
async def list_users(
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
    background_tasks: BackgroundTasks,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
) -> JSONResponse:
    tid = tenant_id(user)
    items, total = await UserModel.list_by_tenant(tid, page=page, limit=limit)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="users",
        action="users.list",
    )
    return paginated_success_response(map_list(user_doc, items), total, page, limit)


@router.post("")
async def create_user(
    background_tasks: BackgroundTasks,
    body: CreateUserRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
) -> JSONResponse:
    tid = tenant_id(user)
    existing = await UserModel.get_by_email(body.email)
    if existing:
        return error_response("Email already registered", code="duplicate", status_code=400)
    uid = await UserModel.create(
        email=body.email,
        password=body.password,
        role=body.role,
        tenant_id=tid,
        first_name=body.first_name,
        last_name=body.last_name,
        therapeutic_area_ids=body.therapeutic_area_ids,
    )
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="users",
        action="users.create",
        document_id=uid,
    )
    doc = await UserModel.get_by_id(uid, tid)
    return success_response(data=user_doc(doc) if doc else {"id": uid})


@router.patch("/{user_id}")
async def patch_user(
    user_id: str,
    background_tasks: BackgroundTasks,
    body: UpdateUserRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
) -> JSONResponse:
    tid = tenant_id(user)
    if body.active is True:
        await UserModel.activate(user_id, tid)
    elif body.active is False:
        await UserModel.deactivate(user_id, tid)
    if body.first_name is not None or body.last_name is not None:
        await UserModel.update_profile(
            user_id,
            tid,
            first_name=body.first_name,
            last_name=body.last_name,
        )
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="users",
        action="users.patch",
        document_id=user_id,
    )
    doc = await UserModel.get_by_id(user_id, tid)
    return success_response(data=user_doc(doc) if doc else {})


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
) -> JSONResponse:
    tid = tenant_id(user)
    await UserModel.deactivate(user_id, tid)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="users",
        action="users.delete",
        document_id=user_id,
    )
    return success_response(message="User deactivated")


@router.post("/{user_id}/role")
async def update_role(
    user_id: str,
    background_tasks: BackgroundTasks,
    body: UpdateRoleRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
) -> JSONResponse:
    tid = tenant_id(user)
    ok = await UserModel.toggle_role(user_id, tid, body.role)
    if not ok:
        return error_response("User not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="users",
        action="users.role",
        document_id=user_id,
        metadata={"role": body.role},
    )
    doc = await UserModel.get_by_id(user_id, tid)
    return success_response(data=user_doc(doc) if doc else {})


@router.post("/{user_id}/therapeutic-areas")
async def assign_areas(
    user_id: str,
    background_tasks: BackgroundTasks,
    body: AssignTherapeuticAreasRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
) -> JSONResponse:
    tid = tenant_id(user)
    ok = await UserModel.assign_therapeutic_areas(user_id, tid, body.therapeutic_area_ids)
    if not ok:
        return error_response("User not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="users",
        action="users.therapeutic_areas",
        document_id=user_id,
    )
    doc = await UserModel.get_by_id(user_id, tid)
    return success_response(data=user_doc(doc) if doc else {})
