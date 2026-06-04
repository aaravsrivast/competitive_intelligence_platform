from datetime import datetime, timezone
from typing import Any, List, Optional

from bson import ObjectId

from models import get_database


class TenantModel:
    collection_name = "tenants"

    @classmethod
    def _col(cls):
        return get_database()[cls.collection_name]

    @classmethod
    async def ensure_indexes(cls) -> None:
        col = cls._col()
        await col.create_index("slug", unique=True)
        await col.create_index("name")

    @classmethod
    async def create(
        cls,
        name: str,
        slug: str,
        settings: Optional[dict[str, Any]] = None,
    ) -> str:
        now = datetime.now(timezone.utc)
        doc = {
            "name": name,
            "slug": slug,
            "settings": settings or {},
            "admin_user_ids": [],
            "created_at": now,
            "updated_at": now,
        }
        result = await cls._col().insert_one(doc)
        return str(result.inserted_id)

    @classmethod
    async def get_by_id(cls, tenant_id: str) -> Optional[dict[str, Any]]:
        try:
            oid = ObjectId(tenant_id)
        except Exception:
            return None
        return await cls._col().find_one({"_id": oid})

    @classmethod
    async def list_all(
        cls,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[dict[str, Any]], int]:
        skip = (page - 1) * limit
        total = await cls._col().count_documents({})
        cursor = (
            cls._col()
            .find({})
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )
        items = await cursor.to_list(length=limit)
        return items, total

    @classmethod
    async def update(
        cls,
        tenant_id: str,
        name: Optional[str] = None,
        slug: Optional[str] = None,
        settings: Optional[dict[str, Any]] = None,
    ) -> bool:
        try:
            oid = ObjectId(tenant_id)
        except Exception:
            return False
        update: dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
        if name is not None:
            update["name"] = name
        if slug is not None:
            update["slug"] = slug
        if settings is not None:
            update["settings"] = settings
        result = await cls._col().update_one({"_id": oid}, {"$set": update})
        return result.modified_count > 0

    @classmethod
    async def delete(cls, tenant_id: str) -> bool:
        try:
            oid = ObjectId(tenant_id)
        except Exception:
            return False
        result = await cls._col().delete_one({"_id": oid})
        return result.deleted_count > 0

    @classmethod
    async def assign_admin(cls, tenant_id: str, user_id: str) -> bool:
        try:
            oid = ObjectId(tenant_id)
            uid = ObjectId(user_id)
        except Exception:
            return False
        result = await cls._col().update_one(
            {"_id": oid},
            {
                "$addToSet": {"admin_user_ids": uid},
                "$set": {"updated_at": datetime.now(timezone.utc)},
            },
        )
        return result.modified_count > 0 or result.matched_count > 0

    @classmethod
    async def remove_admin(cls, tenant_id: str, user_id: str) -> bool:
        try:
            oid = ObjectId(tenant_id)
            uid = ObjectId(user_id)
        except Exception:
            return False
        result = await cls._col().update_one(
            {"_id": oid},
            {
                "$pull": {"admin_user_ids": uid},
                "$set": {"updated_at": datetime.now(timezone.utc)},
            },
        )
        return result.modified_count > 0

    @classmethod
    async def get_admin_ids(cls, tenant_id: str) -> List[ObjectId]:
        doc = await cls.get_by_id(tenant_id)
        if not doc:
            return []
        return list(doc.get("admin_user_ids") or [])
