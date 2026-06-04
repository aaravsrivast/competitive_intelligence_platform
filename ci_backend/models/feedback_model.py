from datetime import datetime, timezone
from typing import Any, List, Optional

from bson import ObjectId

from models import get_database


class FeedbackModel:
    collection_name = "feedbacks"

    @classmethod
    def _col(cls):
        return get_database()[cls.collection_name]

    @classmethod
    async def ensure_indexes(cls) -> None:
        col = cls._col()
        await col.create_index([("tenant_id", 1), ("user_id", 1)])
        await col.create_index([("tenant_id", 1), ("context_type", 1), ("context_id", 1)])

    @classmethod
    async def create(
        cls,
        tenant_id: str,
        user_id: str,
        message: str,
        rating: Optional[int] = None,
        context_type: Optional[str] = None,
        context_id: Optional[str] = None,
    ) -> str:
        now = datetime.now(timezone.utc)
        doc = {
            "tenant_id": ObjectId(tenant_id),
            "user_id": ObjectId(user_id),
            "message": message,
            "rating": rating,
            "context_type": context_type,
            "context_id": ObjectId(context_id) if context_id else None,
            "created_at": now,
            "updated_at": now,
        }
        result = await cls._col().insert_one(doc)
        return str(result.inserted_id)

    @classmethod
    async def list_by_user_and_context(
        cls,
        tenant_id: str,
        user_id: str,
        context_type: Optional[str] = None,
        context_id: Optional[str] = None,
        page: int = 1,
        limit: int = 50,
    ) -> tuple[list[dict[str, Any]], int]:
        try:
            tid = ObjectId(tenant_id)
            uid = ObjectId(user_id)
        except Exception:
            return [], 0
        query: dict[str, Any] = {"tenant_id": tid, "user_id": uid}
        if context_type:
            query["context_type"] = context_type
        if context_id:
            query["context_id"] = ObjectId(context_id)
        skip = (page - 1) * limit
        total = await cls._col().count_documents(query)
        cursor = (
            cls._col()
            .find(query)
            .sort("updated_at", -1)
            .skip(skip)
            .limit(limit)
        )
        items = await cursor.to_list(length=limit)
        return items, total

    @classmethod
    async def get_by_id(
        cls,
        tenant_id: str,
        user_id: str,
        feedback_id: str,
    ) -> Optional[dict[str, Any]]:
        try:
            oid = ObjectId(feedback_id)
            tid = ObjectId(tenant_id)
            uid = ObjectId(user_id)
        except Exception:
            return None
        return await cls._col().find_one(
            {"_id": oid, "tenant_id": tid, "user_id": uid}
        )

    @classmethod
    async def update(
        cls,
        tenant_id: str,
        user_id: str,
        feedback_id: str,
        message: Optional[str] = None,
        rating: Optional[int] = None,
    ) -> bool:
        try:
            oid = ObjectId(feedback_id)
            tid = ObjectId(tenant_id)
            uid = ObjectId(user_id)
        except Exception:
            return False
        update: dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
        if message is not None:
            update["message"] = message
        if rating is not None:
            update["rating"] = rating
        result = await cls._col().update_one(
            {"_id": oid, "tenant_id": tid, "user_id": uid},
            {"$set": update},
        )
        return result.modified_count > 0

    @classmethod
    async def delete(
        cls,
        tenant_id: str,
        user_id: str,
        feedback_id: str,
    ) -> bool:
        try:
            oid = ObjectId(feedback_id)
            tid = ObjectId(tenant_id)
            uid = ObjectId(user_id)
        except Exception:
            return False
        result = await cls._col().delete_one(
            {"_id": oid, "tenant_id": tid, "user_id": uid}
        )
        return result.deleted_count > 0
