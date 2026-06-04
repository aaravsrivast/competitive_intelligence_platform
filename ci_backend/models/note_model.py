from datetime import datetime, timezone
from typing import Any, List, Optional

from bson import ObjectId

from models import get_database


class NoteModel:
    collection_name = "notes"

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
        body: str,
        context_type: Optional[str] = None,
        context_id: Optional[str] = None,
    ) -> str:
        now = datetime.now(timezone.utc)
        doc = {
            "tenant_id": ObjectId(tenant_id),
            "user_id": ObjectId(user_id),
            "body": body,
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
        note_id: str,
    ) -> Optional[dict[str, Any]]:
        try:
            oid = ObjectId(note_id)
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
        note_id: str,
        body: str,
    ) -> bool:
        try:
            oid = ObjectId(note_id)
            tid = ObjectId(tenant_id)
            uid = ObjectId(user_id)
        except Exception:
            return False
        result = await cls._col().update_one(
            {"_id": oid, "tenant_id": tid, "user_id": uid},
            {
                "$set": {
                    "body": body,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        return result.modified_count > 0

    @classmethod
    async def delete(
        cls,
        tenant_id: str,
        user_id: str,
        note_id: str,
    ) -> bool:
        try:
            oid = ObjectId(note_id)
            tid = ObjectId(tenant_id)
            uid = ObjectId(user_id)
        except Exception:
            return False
        result = await cls._col().delete_one(
            {"_id": oid, "tenant_id": tid, "user_id": uid}
        )
        return result.deleted_count > 0
