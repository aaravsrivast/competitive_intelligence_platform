from datetime import datetime
from typing import Annotated, Optional, Tuple

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from fastapi.responses import JSONResponse

from models.social_media_model import SocialMediaPostModel
from routes.deps import require_tenant_roles, tenant_id
from schemas.social_media_schemas import CreateSocialMediaPostRequest, UpdateSocialMediaPostRequest
from utils.jwt_utils import CurrentUser
from utils.log_utils import schedule_audit_log
from utils.response_utils import error_response, paginated_success_response, success_response
from utils.serializers import map_list, social_doc

router = APIRouter(prefix="/social-media", tags=["social-media"])


def _parse_range(
    start: Optional[datetime], end: Optional[datetime]
) -> Optional[Tuple[Optional[datetime], Optional[datetime]]]:
    if start or end:
        return (start, end)
    return None


@router.get("")
async def list_posts(
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
    items, total = await SocialMediaPostModel.list_with_filters(
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
        tab="social_media",
        action="list",
    )
    return paginated_success_response(map_list(social_doc, items), total, page, limit)


@router.get("/{post_id}")
async def get_post(
    post_id: str,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    doc = await SocialMediaPostModel.get_by_id(tid, post_id)
    if not doc:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="social_media",
        action="get",
        document_id=post_id,
    )
    return success_response(data=social_doc(doc))


@router.post("")
async def create_post(
    background_tasks: BackgroundTasks,
    body: CreateSocialMediaPostRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
) -> JSONResponse:
    tid = tenant_id(user)
    pid = await SocialMediaPostModel.create(
        tid,
        title=body.title,
        content=body.content,
        platform=body.platform,
        source_url=body.source_url,
        company=body.company,
        priority=body.priority,
        posted_at=body.posted_at,
        metadata=body.metadata,
    )
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="social_media",
        action="create",
        document_id=pid,
    )
    doc = await SocialMediaPostModel.get_by_id(tid, pid)
    return success_response(data=social_doc(doc) if doc else {"id": pid})


@router.patch("/{post_id}")
async def patch_post(
    post_id: str,
    background_tasks: BackgroundTasks,
    body: UpdateSocialMediaPostRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
) -> JSONResponse:
    tid = tenant_id(user)
    fields = body.model_dump(exclude_unset=True)
    ok = await SocialMediaPostModel.update(tid, post_id, fields)
    if not ok:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="social_media",
        action="patch",
        document_id=post_id,
    )
    doc = await SocialMediaPostModel.get_by_id(tid, post_id)
    return success_response(data=social_doc(doc) if doc else {})


@router.delete("/{post_id}")
async def delete_post(
    post_id: str,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
) -> JSONResponse:
    tid = tenant_id(user)
    ok = await SocialMediaPostModel.delete(tid, post_id)
    if not ok:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="social_media",
        action="delete",
        document_id=post_id,
    )
    return success_response(message="Deleted")


@router.post("/{post_id}/highlights")
async def generate_post_highlights(
    post_id: str,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    try:
        text = await SocialMediaPostModel.generate_highlights(tid, post_id)
    except ValueError as exc:
        return error_response(str(exc), code="error", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="social_media",
        action="generate_highlights",
        document_id=post_id,
    )
    return success_response(data={"highlights": text})
