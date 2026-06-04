from datetime import datetime
from typing import Annotated, Optional, Tuple

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from fastapi.responses import JSONResponse

from models.publication_model import PublicationModel
from routes.deps import require_tenant_roles, tenant_id
from schemas.publication_schemas import CreatePublicationRequest, UpdatePublicationRequest
from utils.jwt_utils import CurrentUser
from utils.log_utils import schedule_audit_log
from utils.response_utils import error_response, paginated_success_response, success_response
from utils.serializers import map_list, publication_doc

router = APIRouter(prefix="/publications", tags=["publications"])


def _parse_range(
    start: Optional[datetime], end: Optional[datetime]
) -> Optional[Tuple[Optional[datetime], Optional[datetime]]]:
    if start or end:
        return (start, end)
    return None


@router.get("")
async def list_publications(
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    priority: Optional[str] = None,
    company: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> JSONResponse:
    tid = tenant_id(user)
    dr = _parse_range(start_date, end_date)
    items, total = await PublicationModel.list_with_filters(
        tid,
        date_range=dr,
        priority=priority,
        company=company,
        search=search,
        page=page,
        limit=limit,
    )
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="publications",
        action="list",
    )
    return paginated_success_response(map_list(publication_doc, items), total, page, limit)


@router.get("/{publication_id}")
async def get_publication(
    publication_id: str,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    doc = await PublicationModel.get_by_id(tid, publication_id)
    if not doc:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="publications",
        action="get",
        document_id=publication_id,
    )
    return success_response(data=publication_doc(doc))


@router.post("")
async def create_publication(
    background_tasks: BackgroundTasks,
    body: CreatePublicationRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
) -> JSONResponse:
    tid = tenant_id(user)
    pid = await PublicationModel.create(
        tid,
        title=body.title,
        content=body.content,
        source_url=body.source_url,
        company=body.company,
        priority=body.priority,
        published_at=body.published_at,
        metadata=body.metadata,
    )
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="publications",
        action="create",
        document_id=pid,
    )
    doc = await PublicationModel.get_by_id(tid, pid)
    return success_response(data=publication_doc(doc) if doc else {"id": pid})


@router.patch("/{publication_id}")
async def patch_publication(
    publication_id: str,
    background_tasks: BackgroundTasks,
    body: UpdatePublicationRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
) -> JSONResponse:
    tid = tenant_id(user)
    fields = body.model_dump(exclude_unset=True)
    ok = await PublicationModel.update(tid, publication_id, fields)
    if not ok:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="publications",
        action="patch",
        document_id=publication_id,
    )
    doc = await PublicationModel.get_by_id(tid, publication_id)
    return success_response(data=publication_doc(doc) if doc else {})


@router.delete("/{publication_id}")
async def delete_publication(
    publication_id: str,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
) -> JSONResponse:
    tid = tenant_id(user)
    ok = await PublicationModel.delete(tid, publication_id)
    if not ok:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="publications",
        action="delete",
        document_id=publication_id,
    )
    return success_response(message="Deleted")


@router.post("/{publication_id}/highlights")
async def generate_publication_highlights(
    publication_id: str,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    try:
        text = await PublicationModel.generate_highlights(tid, publication_id)
    except ValueError as exc:
        return error_response(str(exc), code="error", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="publications",
        action="generate_highlights",
        document_id=publication_id,
    )
    return success_response(data={"highlights": text})
