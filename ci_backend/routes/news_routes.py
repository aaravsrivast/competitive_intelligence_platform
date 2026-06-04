from datetime import datetime
from typing import Annotated, Optional, Tuple

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from fastapi.responses import JSONResponse

from models.news_model import NewsModel
from routes.deps import require_tenant_roles, tenant_id
from schemas.news_schemas import CreateNewsRequest, UpdateNewsRequest
from utils.jwt_utils import CurrentUser
from utils.log_utils import schedule_audit_log
from utils.response_utils import error_response, paginated_success_response, success_response
from utils.serializers import map_list, news_doc

router = APIRouter(prefix="/news", tags=["news"])


def _parse_range(
    start: Optional[datetime], end: Optional[datetime]
) -> Optional[Tuple[Optional[datetime], Optional[datetime]]]:
    if start or end:
        return (start, end)
    return None


@router.get("")
async def list_news(
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
    items, total = await NewsModel.list_with_filters(
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
        tab="news",
        action="list",
    )
    return paginated_success_response(map_list(news_doc, items), total, page, limit)


@router.get("/{article_id}")
async def get_news(
    article_id: str,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    doc = await NewsModel.get_by_id(tid, article_id)
    if not doc:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="news",
        action="get",
        document_id=article_id,
    )
    return success_response(data=news_doc(doc))


@router.post("")
async def create_news(
    background_tasks: BackgroundTasks,
    body: CreateNewsRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
) -> JSONResponse:
    tid = tenant_id(user)
    aid = await NewsModel.create(
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
        tab="news",
        action="create",
        document_id=aid,
    )
    doc = await NewsModel.get_by_id(tid, aid)
    return success_response(data=news_doc(doc) if doc else {"id": aid})


@router.patch("/{article_id}")
async def patch_news(
    article_id: str,
    background_tasks: BackgroundTasks,
    body: UpdateNewsRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
) -> JSONResponse:
    tid = tenant_id(user)
    fields = body.model_dump(exclude_unset=True)
    ok = await NewsModel.update(tid, article_id, fields)
    if not ok:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="news",
        action="patch",
        document_id=article_id,
    )
    doc = await NewsModel.get_by_id(tid, article_id)
    return success_response(data=news_doc(doc) if doc else {})


@router.delete("/{article_id}")
async def delete_news(
    article_id: str,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
) -> JSONResponse:
    tid = tenant_id(user)
    ok = await NewsModel.delete(tid, article_id)
    if not ok:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="news",
        action="delete",
        document_id=article_id,
    )
    return success_response(message="Deleted")


@router.post("/{article_id}/highlights")
async def generate_news_highlights(
    article_id: str,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    try:
        text = await NewsModel.generate_highlights(tid, article_id)
    except ValueError as exc:
        return error_response(str(exc), code="error", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="news",
        action="generate_highlights",
        document_id=article_id,
    )
    return success_response(data={"highlights": text})
