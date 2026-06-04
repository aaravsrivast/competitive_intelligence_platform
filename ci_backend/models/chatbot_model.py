from datetime import datetime, timezone
from typing import Any, List, Optional

from bson import ObjectId

from models import get_database


class ChatbotModel:
    collection_name = "chatbot_messages"

    @classmethod
    def _col(cls):
        return get_database()[cls.collection_name]

    @classmethod
    async def ensure_indexes(cls) -> None:
        col = cls._col()
        await col.create_index([("tenant_id", 1), ("user_id", 1), ("created_at", -1)])
        await col.create_index([("tenant_id", 1), ("user_id", 1), ("indication_id", 1)])

    @classmethod
    async def save_message(
        cls,
        tenant_id: str,
        user_id: str,
        role: str,
        content: str,
        indication_id: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> str:
        now = datetime.now(timezone.utc)
        doc = {
            "tenant_id": ObjectId(tenant_id),
            "user_id": ObjectId(user_id),
            "role": role,
            "content": content,
            "indication_id": ObjectId(indication_id) if indication_id else None,
            "metadata": metadata or {},
            "created_at": now,
        }
        result = await cls._col().insert_one(doc)
        return str(result.inserted_id)

    @classmethod
    async def get_history(
        cls,
        tenant_id: str,
        user_id: str,
        indication_id: Optional[str] = None,
        limit: int = 50,
    ) -> List[dict[str, Any]]:
        try:
            tid = ObjectId(tenant_id)
            uid = ObjectId(user_id)
        except Exception:
            return []
        query: dict[str, Any] = {"tenant_id": tid, "user_id": uid}
        if indication_id:
            query["indication_id"] = ObjectId(indication_id)
        cursor = (
            cls._col()
            .find(query)
            .sort("created_at", -1)
            .limit(limit)
        )
        items = await cursor.to_list(length=limit)
        items.reverse()
        return items
