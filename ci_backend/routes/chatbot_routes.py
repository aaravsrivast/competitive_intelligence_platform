from typing import Annotated, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from fastapi.responses import JSONResponse

from models.chatbot_model import ChatbotModel
from models.indication_model import IndicationModel
from models.tenant_model import TenantModel
from prompts.chatbot_system_prompt import CHATBOT_SYSTEM
from routes.deps import require_tenant_roles, tenant_id
from schemas.chatbot_schemas import ChatHistoryMessage, ChatHistoryResponse, ChatMessageRequest
from services.openai_service import chat_completion
from utils.jwt_utils import CurrentUser
from utils.log_utils import schedule_audit_log
from utils.response_utils import success_response

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post("/message")
async def send_message(
    background_tasks: BackgroundTasks,
    body: ChatMessageRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    tenant = await TenantModel.get_by_id(tid)
    tenant_name = (tenant or {}).get("name") or "Tenant"
    indication_name = "General"
    if body.indication_id:
        ind = await IndicationModel.get_by_id(tid, body.indication_id)
        if ind:
            indication_name = ind.get("name") or indication_name
    system = CHATBOT_SYSTEM(indication_name=indication_name, tenant_name=tenant_name)
    await ChatbotModel.save_message(
        tid,
        user.user_id,
        role="user",
        content=body.message,
        indication_id=body.indication_id,
    )
    history = await ChatbotModel.get_history(
        tid, user.user_id, indication_id=body.indication_id, limit=30
    )
    hist_payload: List[dict[str, str]] = []
    for h in history:
        if h.get("role") in ("user", "assistant"):
            hist_payload.append(
                {"role": h["role"], "content": h.get("content") or ""}
            )
    reply = await chat_completion(hist_payload, system)
    await ChatbotModel.save_message(
        tid,
        user.user_id,
        role="assistant",
        content=reply,
        indication_id=body.indication_id,
    )
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="chatbot",
        action="message",
        metadata={"indication_id": body.indication_id},
    )
    return success_response(data={"reply": reply})


@router.get("/history")
async def get_history(
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
    indication_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
) -> JSONResponse:
    tid = tenant_id(user)
    items = await ChatbotModel.get_history(
        tid, user.user_id, indication_id=indication_id, limit=limit
    )
    msgs: list[ChatHistoryMessage] = []
    for m in items:
        msgs.append(
            ChatHistoryMessage(
                role=m.get("role") or "user",
                content=m.get("content") or "",
                created_at=m.get("created_at"),
                indication_id=str(m["indication_id"])
                if m.get("indication_id")
                else None,
                metadata=m.get("metadata") or {},
            )
        )
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="chatbot",
        action="history",
        metadata={"indication_id": indication_id},
    )
    payload = ChatHistoryResponse(messages=msgs)
    return success_response(data=payload.model_dump(mode="json"))
