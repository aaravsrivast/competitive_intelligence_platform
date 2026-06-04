from datetime import datetime
from typing import Annotated, Optional, Tuple

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from fastapi.responses import JSONResponse

from models.log_model import LogModel
from routes.deps import require_tenant_roles, tenant_id
from utils.jwt_utils import CurrentUser
from utils.log_utils import schedule_audit_log
from utils.response_utils import paginated_success_response
from utils.serializers import log_doc, map_list

router = APIRouter(prefix="/logs", tags=["logs"])


def _dr(
    start: Optional[datetime], end: Optional[datetime]
) -> Optional[Tuple[Optional[datetime], Optional[datetime]]]:
    if start or end:
        return (start, end)
    return None


@router.get("")
async def list_logs(
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles("admin"))],
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    tab: Optional[str] = None,
    user_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> JSONResponse:
    tid = tenant_id(user)
    items, total = await LogModel.list_with_filters(
        tid,
        tab=tab,
        user_id=user_id,
        date_range=_dr(start_date, end_date),
        page=page,
        limit=limit,
    )
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="logs",
        action="list",
    )
    return paginated_success_response(map_list(log_doc, items), total, page, limit)
