from typing import Annotated, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from fastapi.responses import JSONResponse

from models.competitive_landscape_model import CompetitiveLandscapeModel
from routes.deps import require_tenant_roles, tenant_id
from schemas.competitors_schemas import CompetitorFinancialsItem, CompetitorsResponse
from services.openai_service import generate_competitor_financials
from utils.jwt_utils import CurrentUser
from utils.log_utils import schedule_audit_log
from utils.response_utils import success_response

router = APIRouter(prefix="/competitors", tags=["competitors"])


@router.get("")
async def competitors_overview(
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
    company: Optional[str] = Query(None),
) -> JSONResponse:
    tid = tenant_id(user)
    companies = await CompetitiveLandscapeModel.distinct_companies(tid)
    companies = sorted({c for c in companies if c})
    fin: Optional[CompetitorFinancialsItem] = None
    if company:
        text = await generate_competitor_financials(company)
        fin = CompetitorFinancialsItem(company=company, financials_markdown=text)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="competitors",
        action="list",
        metadata={"company": company},
    )
    payload = CompetitorsResponse(companies=companies, financials=fin)
    return success_response(data=payload.model_dump())
