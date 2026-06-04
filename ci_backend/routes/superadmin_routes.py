from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse

from models.tenant_model import TenantModel
from models.user_model import UserModel
from schemas.superadmin_schemas import AssignTenantAdminRequest
from schemas.tenant_schemas import CreateTenantRequest, UpdateTenantRequest
from utils.jwt_utils import CurrentUser, role_required
from utils.log_utils import schedule_audit_log
from utils.response_utils import error_response, paginated_success_response, success_response
from utils.serializers import map_list, tenant_doc, user_doc

router = APIRouter(prefix="/superadmin", tags=["superadmin"])


@router.get("/tenants")
async def list_tenants(
    _: Annotated[CurrentUser, Depends(role_required("superadmin"))],
    background_tasks: BackgroundTasks,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
) -> JSONResponse:
    items, total = await TenantModel.list_all(page=page, limit=limit)
    schedule_audit_log(
        background_tasks,
        None,
        None,
        tab="superadmin",
        action="tenants.list",
        metadata={"page": page, "limit": limit},
    )
    return paginated_success_response(map_list(tenant_doc, items), total, page, limit)


@router.post("/tenants")
async def create_tenant(
    background_tasks: BackgroundTasks,
    body: CreateTenantRequest,
    _: Annotated[CurrentUser, Depends(role_required("superadmin"))],
) -> JSONResponse:
    tid = await TenantModel.create(body.name, body.slug, body.settings)
    schedule_audit_log(
        background_tasks,
        None,
        None,
        tab="superadmin",
        action="tenants.create",
        document_id=tid,
    )
    doc = await TenantModel.get_by_id(tid)
    return success_response(data=tenant_doc(doc) if doc else {"id": tid})


@router.get("/tenants/{tenant_id}")
async def get_tenant(
    tenant_id: str,
    background_tasks: BackgroundTasks,
    _: Annotated[CurrentUser, Depends(role_required("superadmin"))],
) -> JSONResponse:
    doc = await TenantModel.get_by_id(tenant_id)
    if not doc:
        return error_response("Tenant not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        None,
        None,
        tab="superadmin",
        action="tenants.get",
        document_id=tenant_id,
    )
    return success_response(data=tenant_doc(doc))


@router.patch("/tenants/{tenant_id}")
async def patch_tenant(
    tenant_id: str,
    background_tasks: BackgroundTasks,
    body: UpdateTenantRequest,
    _: Annotated[CurrentUser, Depends(role_required("superadmin"))],
) -> JSONResponse:
    ok = await TenantModel.update(
        tenant_id,
        name=body.name,
        slug=body.slug,
        settings=body.settings,
    )
    if not ok:
        return error_response("Tenant not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        None,
        None,
        tab="superadmin",
        action="tenants.update",
        document_id=tenant_id,
    )
    doc = await TenantModel.get_by_id(tenant_id)
    return success_response(data=tenant_doc(doc) if doc else {})


@router.delete("/tenants/{tenant_id}")
async def delete_tenant(
    tenant_id: str,
    background_tasks: BackgroundTasks,
    _: Annotated[CurrentUser, Depends(role_required("superadmin"))],
) -> JSONResponse:
    ok = await TenantModel.delete(tenant_id)
    if not ok:
        return error_response("Tenant not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        None,
        None,
        tab="superadmin",
        action="tenants.delete",
        document_id=tenant_id,
    )
    return success_response(message="Deleted")


@router.post("/tenants/{tenant_id}/admins")
async def assign_tenant_admin(
    tenant_id: str,
    background_tasks: BackgroundTasks,
    body: AssignTenantAdminRequest,
    _: Annotated[CurrentUser, Depends(role_required("superadmin"))],
) -> JSONResponse:
    tenant = await TenantModel.get_by_id(tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    existing = await UserModel.get_by_email(body.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    uid = await UserModel.create(
        email=body.email,
        password=body.password,
        role="admin",
        tenant_id=tenant_id,
        first_name=body.first_name,
        last_name=body.last_name,
    )
    await TenantModel.assign_admin(tenant_id, uid)
    schedule_audit_log(
        background_tasks,
        None,
        None,
        tab="superadmin",
        action="tenants.assign_admin",
        document_id=tenant_id,
        metadata={"user_id": uid},
    )
    user = await UserModel.get_by_id_global(uid)
    return success_response(data=user_doc(user) if user else {"id": uid})


@router.delete("/tenants/{tenant_id}/admins/{user_id}")
async def remove_tenant_admin(
    tenant_id: str,
    user_id: str,
    background_tasks: BackgroundTasks,
    _: Annotated[CurrentUser, Depends(role_required("superadmin"))],
) -> JSONResponse:
    await TenantModel.remove_admin(tenant_id, user_id)
    u = await UserModel.get_by_id(user_id, tenant_id)
    if u:
        await UserModel.deactivate(user_id, tenant_id)
    schedule_audit_log(
        background_tasks,
        None,
        None,
        tab="superadmin",
        action="tenants.remove_admin",
        document_id=tenant_id,
        metadata={"user_id": user_id},
    )
    return success_response(message="Admin removed")
