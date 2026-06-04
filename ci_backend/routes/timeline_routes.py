from typing import Annotated, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from fastapi.responses import JSONResponse

from models.competitive_landscape_model import CompetitiveLandscapeModel
from routes.deps import require_tenant_roles, tenant_id
from schemas.timeline_schemas import TimelineQuarterBucket, TimelineResponse
from utils.jwt_utils import CurrentUser
from utils.log_utils import schedule_audit_log
from utils.response_utils import success_response

router = APIRouter(prefix="/timeline", tags=["timeline"])


@router.get("")
async def timeline_view(
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
    indication_id: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
) -> JSONResponse:
    tid = tenant_id(user)
    buckets = await CompetitiveLandscapeModel.quarterly_timeline(
        tid, indication_id=indication_id, company=company
    )
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="timeline",
        action="view",
        metadata={"indication_id": indication_id, "company": company},
    )
    payload = TimelineResponse(
        buckets=[TimelineQuarterBucket(**b) for b in buckets]
    )
    return success_response(data=payload.model_dump())
