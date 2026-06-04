import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated

import aiofiles
from fastapi import APIRouter, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from jinja2 import Environment, FileSystemLoader, select_autoescape

from config import get_settings
from models.report_model import ReportModel
from models.tenant_model import TenantModel
from routes.deps import require_tenant_roles, tenant_id
from schemas.report_schemas import GenerateReportRequest
from services.gamma_service import generate_report_pdf
from utils.jwt_utils import CurrentUser
from utils.log_utils import schedule_audit_log
from utils.response_utils import error_response, success_response
from utils.serializers import report_doc

router = APIRouter(prefix="/reports", tags=["reports"])

_env = Environment(
    loader=FileSystemLoader(str(Path(__file__).resolve().parent.parent / "templates")),
    autoescape=select_autoescape(["html", "xml"]),
)


@router.post("/generate")
async def generate_report(
    background_tasks: BackgroundTasks,
    body: GenerateReportRequest,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    tenant = await TenantModel.get_by_id(tid)
    tenant_name = (tenant or {}).get("name") or ""
    html = _env.get_template("report_pdf.html").render(
        title=body.title,
        tenant_name=tenant_name,
        generated_at=datetime.now(timezone.utc).isoformat(),
        sections=body.payload.get("sections") or [],
        rows=body.payload.get("rows") or [],
        columns=body.payload.get("columns") or [],
    )
    try:
        pdf_bytes = await generate_report_pdf({"title": body.title, "html": html})
    except Exception as exc:
        return error_response(str(exc), code="pdf_failed", status_code=500)
    settings = get_settings()
    reports_dir = Path("uploads/reports")
    reports_dir.mkdir(parents=True, exist_ok=True)
    fname = f"{uuid.uuid4().hex}.pdf"
    fpath = reports_dir / fname
    async with aiofiles.open(fpath, "wb") as out:
        await out.write(pdf_bytes)
    public = settings.PUBLIC_BASE_URL.rstrip("/")
    storage_path = f"{public}/static/reports/{fname}"
    rid = await ReportModel.create(
        tid,
        title=body.title,
        created_by_user_id=user.user_id,
        pdf_storage_path=storage_path,
        payload_summary=body.payload,
    )
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="reports",
        action="generate",
        document_id=rid,
    )
    doc = await ReportModel.get_by_id(tid, rid)
    return success_response(data=report_doc(doc) if doc else {"id": rid})


@router.get("/{report_id}")
async def get_report(
    report_id: str,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(require_tenant_roles(["admin", "user"]))],
) -> JSONResponse:
    tid = tenant_id(user)
    doc = await ReportModel.get_by_id(tid, report_id)
    if not doc:
        return error_response("Not found", code="not_found", status_code=404)
    schedule_audit_log(
        background_tasks,
        tid,
        user.user_id,
        tab="reports",
        action="get",
        document_id=report_id,
    )
    return success_response(data=report_doc(doc))
