from typing import Annotated, Any, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from fastapi.responses import JSONResponse

from models.competitive_landscape_model import CompetitiveLandscapeModel
from routes.deps import require_tenant_roles, tenant_id
from schemas.product_profile_schemas import ProductProfileItem
from services.openai_service import generate_product_profile
from utils.jwt_utils import CurrentUser
from utils.log_utils import schedule_audit_log
from utils.response_utils import error_response, paginated_success_response, success_response
from utils.serializers import cl_doc

router = APIRouter(prefix="/product-profiles", tags=["product-profiles"])


@router.get("")
async def list_profiles(
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
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
    data: list[dict[str, Any]] = []
    for doc in items:
        s = cl_doc(doc)
        data.append(
            ProductProfileItem(
                id=s["id"],
                tenant_id=s["tenant_id"],
                company=s["company"],
                competitor_asset=s["competitor_asset"],
                indication_id=s["indication_id"],
                phase=s["phase"],
                nct_id=s.get("nct_id"),
                profile_markdown=s.get("product_profile"),
            ).model_dump()
        )
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="product_profiles",
        action="list",
    )
    return paginated_success_response(data, total, page, limit)


@router.get("/{card_id}")
async def get_profile(
    card_id: str,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    doc = await CompetitiveLandscapeModel.get_by_id(tid, card_id)
    if not doc:
        return error_response("Not found", code="not_found", status_code=404)
    s = cl_doc(doc)
    md = s.get("product_profile")
    if not md:
        md = await generate_product_profile(s)
        await CompetitiveLandscapeModel.update(
            tid,
            card_id,
            {"product_profile": md},
        )
        schedule_audit_log(
            background_tasks,
            tid,
            user.user_id,
            tab="product_profiles",
            action="profile_generated",
            document_id=card_id,
        )
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="product_profiles",
        action="get",
        document_id=card_id,
    )
    payload = ProductProfileItem(
        id=s["id"],
        tenant_id=s["tenant_id"],
        company=s["company"],
        competitor_asset=s["competitor_asset"],
        indication_id=s["indication_id"],
        phase=s["phase"],
        nct_id=s.get("nct_id"),
        profile_markdown=md,
    )
    return success_response(data=payload.model_dump())
