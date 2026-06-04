from typing import Annotated, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from fastapi.responses import JSONResponse

from models.note_model import NoteModel
from routes.deps import require_tenant_roles, tenant_id
from schemas.note_schemas import CreateNoteRequest, UpdateNoteRequest
from utils.jwt_utils import CurrentUser
from utils.log_utils import schedule_audit_log
from utils.response_utils import error_response, paginated_success_response, success_response
from utils.serializers import map_list, note_doc

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("")
async def list_notes(
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    context_type: Optional[str] = None,
    context_id: Optional[str] = None,
) -> JSONResponse:
    tid = tenant_id(user)
    items, total = await NoteModel.list_by_user_and_context(
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
        tab="notes",
        action="list",
    )
    return paginated_success_response(map_list(note_doc, items), total, page, limit)


@router.get("/{note_id}")
async def get_note(
    note_id: str,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    doc = await NoteModel.get_by_id(tid, user.user_id, note_id)
    if not doc:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="notes",
        action="get",
        document_id=note_id,
    )
    return success_response(data=note_doc(doc))


@router.post("")
async def create_note(
    background_tasks: BackgroundTasks,
    body: CreateNoteRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    nid = await NoteModel.create(
        tid,
        user.user_id,
        body.body,
        context_type=body.context_type,
        context_id=body.context_id,
    )
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="notes",
        action="create",
        document_id=nid,
    )
    doc = await NoteModel.get_by_id(tid, user.user_id, nid)
    return success_response(data=note_doc(doc) if doc else {"id": nid})


@router.patch("/{note_id}")
async def patch_note(
    note_id: str,
    background_tasks: BackgroundTasks,
    body: UpdateNoteRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    ok = await NoteModel.update(tid, user.user_id, note_id, body.body)
    if not ok:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="notes",
        action="patch",
        document_id=note_id,
    )
    doc = await NoteModel.get_by_id(tid, user.user_id, note_id)
    return success_response(data=note_doc(doc) if doc else {})


@router.delete("/{note_id}")
async def delete_note(
    note_id: str,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    ok = await NoteModel.delete(tid, user.user_id, note_id)
    if not ok:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="notes",
        action="delete",
        document_id=note_id,
    )
    return success_response(message="Deleted")
