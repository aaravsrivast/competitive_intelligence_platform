from typing import Annotated, Any

from fastapi import APIRouter, BackgroundTasks, Depends
from fastapi.responses import JSONResponse

from models.tenant_model import TenantModel
from routes.deps import require_tenant_roles, tenant_id
from schemas.tenant_schemas import PatchTenantSettingsRequest, TenantSettingsResponse
from utils.jwt_utils import CurrentUser
from utils.log_utils import schedule_audit_log
from utils.response_utils import error_response, success_response
from utils.serializers import tenant_doc

router = APIRouter(prefix="/tenant", tags=["tenant"])


@router.get("/settings")
async def get_settings_route(
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    doc = await TenantModel.get_by_id(tid)
    if not doc:
        return error_response("Tenant not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="tenant",
        action="settings.get",
    )
    payload = TenantSettingsResponse(
        tenant_id=tid,
        name=doc.get("name") or "",
        settings=doc.get("settings") or {},
    )
    return success_response(data=payload.model_dump())


@router.patch("/settings")
async def patch_settings(
    background_tasks: BackgroundTasks,
    body: PatchTenantSettingsRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
) -> JSONResponse:
    tid = tenant_id(user)
    doc = await TenantModel.get_by_id(tid)
    if not doc:
        return error_response("Tenant not found", code="not_found", status_code=404)
    merged: dict[str, Any] = dict(doc.get("settings") or {})
    merged.update(body.settings)
    ok = await TenantModel.update(tenant_id=tid, settings=merged)
    if not ok:
        return error_response("Update failed", code="error", status_code=400)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="tenant",
        action="settings.patch",
        metadata={"keys": list(body.settings.keys())},
    )
    updated = await TenantModel.get_by_id(tid)
    return success_response(data=tenant_doc(updated) if updated else {})
