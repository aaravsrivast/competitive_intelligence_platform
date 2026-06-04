from datetime import datetime, timezone
from typing import Any, List, Optional, Tuple

from bson import ObjectId

from models import get_database


class LogModel:
    collection_name = "logs"

    @classmethod
    def _col(cls):
        return get_database()[cls.collection_name]

    @classmethod
    async def ensure_indexes(cls) -> None:
        col = cls._col()
        await col.create_index([("tenant_id", 1), ("created_at", -1)])
        await col.create_index([("tenant_id", 1), ("tab", 1)])
        await col.create_index([("tenant_id", 1), ("user_id", 1)])

    @classmethod
    async def record(
        cls,
        tenant_id: str,
        user_id: Optional[str],
        tab: str,
        action: str,
        document_id: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> str:
        now = datetime.now(timezone.utc)
        doc = {
            "tenant_id": ObjectId(tenant_id) if tenant_id else None,
            "user_id": ObjectId(user_id) if user_id else None,
            "tab": tab,
            "action": action,
            "document_id": document_id,
            "metadata": metadata or {},
            "created_at": now,
        }
        result = await cls._col().insert_one(doc)
        return str(result.inserted_id)

    @classmethod
    async def list_with_filters(
        cls,
        tenant_id: str,
        tab: Optional[str] = None,
        user_id: Optional[str] = None,
        date_range: Optional[Tuple[Optional[datetime], Optional[datetime]]] = None,
        page: int = 1,
        limit: int = 50,
    ) -> tuple[list[dict[str, Any]], int]:
        try:
            tid = ObjectId(tenant_id)
        except Exception:
            return [], 0
        query: dict[str, Any] = {"tenant_id": tid}
        if tab:
            query["tab"] = tab
        if user_id:
            query["user_id"] = ObjectId(user_id)
        if date_range:
            start, end = date_range
            dr: dict[str, Any] = {}
            if start:
                dr["$gte"] = start
            if end:
                dr["$lte"] = end
            if dr:
                query["created_at"] = dr
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
