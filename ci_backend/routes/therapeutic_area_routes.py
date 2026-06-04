from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from fastapi.responses import JSONResponse

from models.indication_model import IndicationModel
from models.therapeutic_area_model import TherapeuticAreaModel
from routes.deps import require_tenant_roles, tenant_id
from schemas.therapeutic_area_schemas import (
    CreateIndicationRequest,
    CreateTherapeuticAreaRequest,
    UpdateTherapeuticAreaRequest,
)
from utils.jwt_utils import CurrentUser
from utils.log_utils import schedule_audit_log
from utils.response_utils import error_response, paginated_success_response, success_response
from utils.serializers import indication_doc, map_list, therapeutic_area_doc

router = APIRouter(prefix="/therapeutic-areas", tags=["therapeutic-areas"])


@router.get("")
async def list_areas(
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
    background_tasks: BackgroundTasks,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
) -> JSONResponse:
    tid = tenant_id(user)
    items, total = await TherapeuticAreaModel.list_for_tenant(tid, page=page, limit=limit)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="therapeutic_areas",
        action="list",
    )
    return paginated_success_response(
        map_list(therapeutic_area_doc, items), total, page, limit
    )


@router.post("")
async def create_area(
    background_tasks: BackgroundTasks,
    body: CreateTherapeuticAreaRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
) -> JSONResponse:
    tid = tenant_id(user)
    aid = await TherapeuticAreaModel.create(tid, body.name, body.description)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="therapeutic_areas",
        action="create",
        document_id=aid,
    )
    doc = await TherapeuticAreaModel.get_by_id(tid, aid)
    return success_response(data=therapeutic_area_doc(doc) if doc else {"id": aid})


@router.get("/{area_id}")
async def get_area(
    area_id: str,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    doc = await TherapeuticAreaModel.get_by_id(tid, area_id)
    if not doc:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="therapeutic_areas",
        action="get",
        document_id=area_id,
    )
    return success_response(data=therapeutic_area_doc(doc))


@router.patch("/{area_id}")
async def patch_area(
    area_id: str,
    background_tasks: BackgroundTasks,
    body: UpdateTherapeuticAreaRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
) -> JSONResponse:
    tid = tenant_id(user)
    ok = await TherapeuticAreaModel.update(tid, area_id, name=body.name, description=body.description)
    if not ok:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="therapeutic_areas",
        action="patch",
        document_id=area_id,
    )
    doc = await TherapeuticAreaModel.get_by_id(tid, area_id)
    return success_response(data=therapeutic_area_doc(doc) if doc else {})


@router.delete("/{area_id}")
async def delete_area(
    area_id: str,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
) -> JSONResponse:
    tid = tenant_id(user)
    ok = await TherapeuticAreaModel.delete(tid, area_id)
    if not ok:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="therapeutic_areas",
        action="delete",
        document_id=area_id,
    )
    return success_response(message="Deleted")


@router.get("/{area_id}/indications")
async def list_indications(
    area_id: str,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    items = await IndicationModel.list_for_therapeutic_area(tid, area_id)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="indications",
        action="list",
        document_id=area_id,
    )
    return success_response(data=map_list(indication_doc, items))


@router.post("/{area_id}/indications")
async def add_indication(
    area_id: str,
    background_tasks: BackgroundTasks,
    body: CreateIndicationRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
) -> JSONResponse:
    tid = tenant_id(user)
    try:
        iid = await TherapeuticAreaModel.add_indication(
            tid,
            area_id,
            body.name,
            code=body.code,
            description=body.description,
        )
    except ValueError as exc:
        return error_response(str(exc), code="error", status_code=400)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="indications",
        action="create",
        document_id=iid,
    )
    doc = await IndicationModel.get_by_id(tid, iid)
    return success_response(data=indication_doc(doc) if doc else {"id": iid})


@router.delete("/{area_id}/indications/{indication_id}")
async def remove_indication(
    area_id: str,
    indication_id: str,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
) -> JSONResponse:
    tid = tenant_id(user)
    ok = await TherapeuticAreaModel.remove_indication(tid, indication_id)
    if not ok:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="indications",
        action="delete",
        document_id=indication_id,
        metadata={"area_id": area_id},
    )
    return success_response(message="Deleted")
