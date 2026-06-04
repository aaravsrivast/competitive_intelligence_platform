from datetime import datetime, timezone
from typing import Any, List, Optional

from bson import ObjectId

from models import get_database


class ReportModel:
    collection_name = "reports"

    @classmethod
    def _col(cls):
        return get_database()[cls.collection_name]

    @classmethod
    async def ensure_indexes(cls) -> None:
        col = cls._col()
        await col.create_index([("tenant_id", 1), ("created_at", -1)])
        await col.create_index("tenant_id")

    @classmethod
    async def create(
        cls,
        tenant_id: str,
        title: str,
        created_by_user_id: str,
        pdf_storage_path: str,
        payload_summary: Optional[dict[str, Any]] = None,
    ) -> str:
        now = datetime.now(timezone.utc)
        doc = {
            "tenant_id": ObjectId(tenant_id),
            "title": title,
            "created_by_user_id": ObjectId(created_by_user_id),
            "pdf_storage_path": pdf_storage_path,
            "payload_summary": payload_summary or {},
            "created_at": now,
        }
        result = await cls._col().insert_one(doc)
        return str(result.inserted_id)

    @classmethod
    async def get_by_id(cls, tenant_id: str, report_id: str) -> Optional[dict[str, Any]]:
        try:
            oid = ObjectId(report_id)
            tid = ObjectId(tenant_id)
        except Exception:
            return None
        return await cls._col().find_one({"_id": oid, "tenant_id": tid})

    @classmethod
    async def list_by_tenant(
        cls,
        tenant_id: str,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[dict[str, Any]], int]:
        try:
            tid = ObjectId(tenant_id)
        except Exception:
            return [], 0
        query = {"tenant_id": tid}
        skip = (page - 1) * limit
        total = await cls._col().count_documents(query)
        cursor = (
            cls._col()
            .find(query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )
        items = await cursor.to_list(length=limit)
        return items, total
