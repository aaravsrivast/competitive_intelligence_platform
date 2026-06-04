from typing import Annotated, Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from fastapi.responses import JSONResponse

from models.competitive_landscape_model import CompetitiveLandscapeModel
from routes.deps import require_tenant_roles, tenant_id
from schemas.competitive_landscape_schemas import (
    CreateCompetitiveLandscapeRequest,
    KanbanResponse,
    UpdateCompetitiveLandscapeRequest,
    UpdatePhaseRequest,
)
from utils.jwt_utils import CurrentUser
from utils.log_utils import schedule_audit_log
from utils.response_utils import error_response, paginated_success_response, success_response
from utils.serializers import cl_doc, map_list

router = APIRouter(prefix="/competitive-landscape", tags=["competitive-landscape"])


@router.get("/kanban")
async def get_kanban(
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
    background_tasks: BackgroundTasks,
    indication_id: str = Query(...),
) -> JSONResponse:
    tid = tenant_id(user)
    grouped = await CompetitiveLandscapeModel.get_kanban_view(tid, indication_id)
    out: Dict[str, List[dict[str, Any]]] = {}
    for phase, cards in grouped.items():
        out[phase] = [cl_doc(c) for c in cards]
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="competitive_landscape",
        action="kanban",
        metadata={"indication_id": indication_id},
    )
    payload = KanbanResponse(phases=out)
    return success_response(data=payload.model_dump())


@router.get("")
async def list_cards(
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
    background_tasks: BackgroundTasks,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    indication_id: Optional[str] = None,
    company: Optional[str] = None,
    phase: Optional[str] = None,
    sub_indication: Optional[str] = None,
    priority: Optional[str] = None,
) -> JSONResponse:
    tid = tenant_id(user)
    items, total = await CompetitiveLandscapeModel.list_with_filters(
        tid,
        indication_id=indication_id,
        company=company,
        phase=phase,
        sub_indication=sub_indication,
        priority=priority,
        page=page,
        limit=limit,
    )
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="competitive_landscape",
        action="list",
    )
    return paginated_success_response(map_list(cl_doc, items), total, page, limit)


@router.get("/{card_id}")
async def get_card(
    card_id: str,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    doc = await CompetitiveLandscapeModel.get_by_id(tid, card_id)
    if not doc:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="competitive_landscape",
        action="get",
        document_id=card_id,
    )
    return success_response(data=cl_doc(doc))


@router.post("")
async def create_card(
    background_tasks: BackgroundTasks,
    body: CreateCompetitiveLandscapeRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
) -> JSONResponse:
    tid = tenant_id(user)
    cid = await CompetitiveLandscapeModel.create(
        tenant_id=tid,
        company=body.company,
        competitor_asset=body.competitor_asset,
        indication_id=body.indication_id,
        phase=body.phase,
        roa=body.roa,
        moa=body.moa,
        dosing=body.dosing,
        line_of_therapy=body.line_of_therapy,
        notes=body.notes,
        sub_indication=body.sub_indication,
        formulation=body.formulation,
        target_population=body.target_population,
        study_name=body.study_name,
        nct_id=body.nct_id,
        timeline=body.timeline,
        priority=body.priority,
    )
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="competitive_landscape",
        action="create",
        document_id=cid,
    )
    doc = await CompetitiveLandscapeModel.get_by_id(tid, cid)
    return success_response(data=cl_doc(doc) if doc else {"id": cid})


@router.patch("/{card_id}")
async def patch_card(
    card_id: str,
    background_tasks: BackgroundTasks,
    body: UpdateCompetitiveLandscapeRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
) -> JSONResponse:
    tid = tenant_id(user)
    fields = body.model_dump(exclude_unset=True)
    ok = await CompetitiveLandscapeModel.update(tid, card_id, fields)
    if not ok:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="competitive_landscape",
        action="patch",
        document_id=card_id,
    )
    doc = await CompetitiveLandscapeModel.get_by_id(tid, card_id)
    return success_response(data=cl_doc(doc) if doc else {})


@router.patch("/{card_id}/phase")
async def patch_phase(
    card_id: str,
    background_tasks: BackgroundTasks,
    body: UpdatePhaseRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
) -> JSONResponse:
    tid = tenant_id(user)
    ok = await CompetitiveLandscapeModel.update_phase(tid, card_id, body.phase)
    if not ok:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="competitive_landscape",
        action="phase",
        document_id=card_id,
        metadata={"phase": body.phase},
    )
    doc = await CompetitiveLandscapeModel.get_by_id(tid, card_id)
    return success_response(data=cl_doc(doc) if doc else {})


@router.delete("/{card_id}")
async def delete_card(
    card_id: str,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
) -> JSONResponse:
    tid = tenant_id(user)
    ok = await CompetitiveLandscapeModel.delete(tid, card_id)
    if not ok:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="competitive_landscape",
        action="delete",
        document_id=card_id,
    )
    return success_response(message="Deleted")
