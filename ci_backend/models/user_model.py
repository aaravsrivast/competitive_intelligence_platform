from datetime import datetime, timezone
from typing import Any, List, Optional

from bson import ObjectId

from models import get_database
from utils.password_utils import hash_password, verify_password


class UserModel:
    collection_name = "users"

    @classmethod
    def _col(cls):
        return get_database()[cls.collection_name]

    @classmethod
    async def ensure_indexes(cls) -> None:
        col = cls._col()
        await col.create_index("email", unique=True)
        await col.create_index([("tenant_id", 1), ("email", 1)])
        await col.create_index("tenant_id")
        await col.create_index("role")

    @classmethod
    async def create(
        cls,
        email: str,
        password: str,
        role: str,
        tenant_id: Optional[str] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        therapeutic_area_ids: Optional[List[str]] = None,
    ) -> str:
        now = datetime.now(timezone.utc)
        tid = ObjectId(tenant_id) if tenant_id else None
        doc = {
            "email": email.lower().strip(),
            "password_hash": hash_password(password),
            "role": role,
            "tenant_id": tid,
            "first_name": first_name,
            "last_name": last_name,
            "therapeutic_area_ids": [ObjectId(x) for x in (therapeutic_area_ids or []) if x],
            "active": True,
            "profile_photo_url": None,
            "created_at": now,
            "updated_at": now,
        }
        result = await cls._col().insert_one(doc)
        return str(result.inserted_id)

    @classmethod
    async def get_by_email(cls, email: str) -> Optional[dict[str, Any]]:
        return await cls._col().find_one({"email": email.lower().strip()})

    @classmethod
    async def get_by_id(
        cls,
        user_id: str,
        tenant_id: Optional[str] = None,
    ) -> Optional[dict[str, Any]]:
        try:
            oid = ObjectId(user_id)
        except Exception:
            return None
        query: dict[str, Any] = {"_id": oid}
        if tenant_id is not None:
            query["tenant_id"] = ObjectId(tenant_id)
        return await cls._col().find_one(query)

    @classmethod
    async def get_by_id_global(cls, user_id: str) -> Optional[dict[str, Any]]:
        try:
            oid = ObjectId(user_id)
        except Exception:
            return None
        return await cls._col().find_one({"_id": oid})

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

    @classmethod
    async def verify_credentials(cls, email: str, password: str) -> Optional[dict[str, Any]]:
        user = await cls.get_by_email(email)
        if not user or not user.get("active", True):
            return None
        if not verify_password(password, user["password_hash"]):
            return None
        return user

    @classmethod
    async def toggle_role(cls, user_id: str, tenant_id: str, new_role: str) -> bool:
        try:
            oid = ObjectId(user_id)
            tid = ObjectId(tenant_id)
        except Exception:
            return False
        result = await cls._col().update_one(
            {"_id": oid, "tenant_id": tid},
            {"$set": {"role": new_role, "updated_at": datetime.now(timezone.utc)}},
        )
        return result.modified_count > 0

    @classmethod
    async def assign_therapeutic_areas(
        cls,
        user_id: str,
        tenant_id: str,
        therapeutic_area_ids: List[str],
    ) -> bool:
        try:
            oid = ObjectId(user_id)
            tid = ObjectId(tenant_id)
        except Exception:
            return False
        oids = [ObjectId(x) for x in therapeutic_area_ids]
        result = await cls._col().update_one(
            {"_id": oid, "tenant_id": tid},
            {
                "$set": {
                    "therapeutic_area_ids": oids,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        return result.modified_count > 0

    @classmethod
    async def activate(cls, user_id: str, tenant_id: str) -> bool:
        try:
            oid = ObjectId(user_id)
            tid = ObjectId(tenant_id)
        except Exception:
            return False
        result = await cls._col().update_one(
            {"_id": oid, "tenant_id": tid},
            {"$set": {"active": True, "updated_at": datetime.now(timezone.utc)}},
        )
        return result.modified_count > 0

    @classmethod
    async def deactivate(cls, user_id: str, tenant_id: str) -> bool:
        try:
            oid = ObjectId(user_id)
            tid = ObjectId(tenant_id)
        except Exception:
            return False
        result = await cls._col().update_one(
            {"_id": oid, "tenant_id": tid},
            {"$set": {"active": False, "updated_at": datetime.now(timezone.utc)}},
        )
        return result.modified_count > 0

    @classmethod
    async def update_profile(
        cls,
        user_id: str,
        tenant_id: Optional[str],
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        profile_photo_url: Optional[str] = None,
    ) -> bool:
        try:
            oid = ObjectId(user_id)
        except Exception:
            return False
        query: dict[str, Any] = {"_id": oid}
        if tenant_id is not None:
            query["tenant_id"] = ObjectId(tenant_id)
        update: dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
        if first_name is not None:
            update["first_name"] = first_name
        if last_name is not None:
            update["last_name"] = last_name
        if profile_photo_url is not None:
            update["profile_photo_url"] = profile_photo_url
        result = await cls._col().update_one(query, {"$set": update})
        return result.modified_count > 0

    @classmethod
    async def change_password(
        cls,
        user_id: str,
        tenant_id: Optional[str],
        new_password: str,
    ) -> bool:
        try:
            oid = ObjectId(user_id)
        except Exception:
            return False
        query: dict[str, Any] = {"_id": oid}
        if tenant_id is not None:
            query["tenant_id"] = ObjectId(tenant_id)
        result = await cls._col().update_one(
            query,
            {
                "$set": {
                    "password_hash": hash_password(new_password),
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        return result.modified_count > 0
