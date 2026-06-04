from typing import Annotated, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from fastapi.responses import JSONResponse

from models.clinical_trial_model import ClinicalTrialModel
from routes.deps import require_tenant_roles, tenant_id
from services.clinical_trials_service import fetch_nct_details
from utils.jwt_utils import CurrentUser
from utils.log_utils import schedule_audit_log
from utils.response_utils import error_response, paginated_success_response, success_response
from utils.serializers import clinical_trial_doc, map_list

router = APIRouter(prefix="/clinical-trials", tags=["clinical-trials"])


@router.get("")
async def list_trials(
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    search: Optional[str] = None,
) -> JSONResponse:
    tid = tenant_id(user)
    items, total = await ClinicalTrialModel.list_with_filters(
        tid, search=search, page=page, limit=limit
    )
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="clinical_trials",
        action="list",
    )
    return paginated_success_response(map_list(clinical_trial_doc, items), total, page, limit)


@router.post("/sync/{nct_id}")
async def sync_trial(
    nct_id: str,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    try:
        payload = await fetch_nct_details(nct_id)
    except Exception as exc:
        return error_response(str(exc), code="sync_failed", status_code=400)
    rid = await ClinicalTrialModel.upsert_from_nct(tid, nct_id, payload)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="clinical_trials",
        action="sync",
        document_id=rid,
        metadata={"nct_id": nct_id},
    )
    doc = await ClinicalTrialModel.get_by_id(tid, rid)
    return success_response(data=clinical_trial_doc(doc) if doc else {"id": rid})


@router.get("/{trial_id}")
async def get_trial(
    trial_id: str,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    doc = await ClinicalTrialModel.get_by_id(tid, trial_id)
    if not doc:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="clinical_trials",
        action="get",
        document_id=trial_id,
    )
    return success_response(data=clinical_trial_doc(doc))
