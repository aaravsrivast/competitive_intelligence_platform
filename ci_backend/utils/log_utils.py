from typing import Any, Optional

from fastapi import BackgroundTasks

from models.log_model import LogModel


def schedule_audit_log(
    background_tasks: BackgroundTasks,
    tenant_id: Optional[str],
    user_id: Optional[str],
    tab: str,
    action: str,
    document_id: Optional[str] = None,
    metadata: Optional[dict[str, Any]] = None,
) -> None:
    background_tasks.add_task(
        _record_log,
        tenant_id,
        user_id,
        tab,
        action,
        document_id,
        metadata,
    )


async def _record_log(
    tenant_id: Optional[str],
    user_id: Optional[str],
    tab: str,
    action: str,
    document_id: Optional[str],
    metadata: Optional[dict[str, Any]],
) -> None:
    await LogModel.record(
        tenant_id=tenant_id or "",
        user_id=user_id,
        tab=tab,
        action=action,
        document_id=document_id,
        metadata=metadata,
    )
