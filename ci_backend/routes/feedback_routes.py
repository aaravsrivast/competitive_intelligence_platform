from typing import Annotated, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from fastapi.responses import JSONResponse

from models.feedback_model import FeedbackModel
from routes.deps import require_tenant_roles, tenant_id
from schemas.feedback_schemas import CreateFeedbackRequest, UpdateFeedbackRequest
from utils.jwt_utils import CurrentUser
from utils.log_utils import schedule_audit_log
from utils.response_utils import error_response, paginated_success_response, success_response
from utils.serializers import feedback_doc, map_list

router = APIRouter(prefix="/feedbacks", tags=["feedbacks"])


@router.get("")
async def list_feedback(
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    context_type: Optional[str] = None,
    context_id: Optional[str] = None,
) -> JSONResponse:
    tid = tenant_id(user)
    items, total = await FeedbackModel.list_by_user_and_context(
        tid,
        user.user_id,
        context_type=context_type,
        context_id=context_id,
        page=page,
        limit=limit,
    )
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="feedbacks",
        action="list",
    )
    return paginated_success_response(map_list(feedback_doc, items), total, page, limit)


@router.get("/{feedback_id}")
async def get_feedback(
    feedback_id: str,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    doc = await FeedbackModel.get_by_id(tid, user.user_id, feedback_id)
    if not doc:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="feedbacks",
        action="get",
        document_id=feedback_id,
    )
    return success_response(data=feedback_doc(doc))


@router.post("")
async def create_feedback(
    background_tasks: BackgroundTasks,
    body: CreateFeedbackRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    fid = await FeedbackModel.create(
        tid,
        user.user_id,
        body.message,
        rating=body.rating,
        context_type=body.context_type,
        context_id=body.context_id,
    )
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="feedbacks",
        action="create",
        document_id=fid,
    )
    doc = await FeedbackModel.get_by_id(tid, user.user_id, fid)
    return success_response(data=feedback_doc(doc) if doc else {"id": fid})


@router.patch("/{feedback_id}")
async def patch_feedback(
    feedback_id: str,
    background_tasks: BackgroundTasks,
    body: UpdateFeedbackRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    ok = await FeedbackModel.update(
        tid,
        user.user_id,
        feedback_id,
        message=body.message,
        rating=body.rating,
    )
    if not ok:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="feedbacks",
        action="patch",
        document_id=feedback_id,
    )
    doc = await FeedbackModel.get_by_id(tid, user.user_id, feedback_id)
    return success_response(data=feedback_doc(doc) if doc else {})


@router.delete("/{feedback_id}")
async def delete_feedback(
    feedback_id: str,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    ok = await FeedbackModel.delete(tid, user.user_id, feedback_id)
    if not ok:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="feedbacks",
        action="delete",
        document_id=feedback_id,
    )
    return success_response(message="Deleted")
