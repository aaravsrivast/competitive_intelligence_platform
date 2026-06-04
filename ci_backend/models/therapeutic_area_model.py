from datetime import datetime, timezone
from typing import Any, List, Optional

from bson import ObjectId

from models import get_database
from models.indication_model import delete_indication_document, insert_indication_document


class TherapeuticAreaModel:
    collection_name = "therapeutic_areas"

    @classmethod
    def _col(cls):
        return get_database()[cls.collection_name]

    @classmethod
    async def ensure_indexes(cls) -> None:
        col = cls._col()
        await col.create_index([("tenant_id", 1), ("name", 1)])
        await col.create_index("tenant_id")

    @classmethod
    async def create(
        cls,
        tenant_id: str,
        name: str,
        description: Optional[str] = None,
    ) -> str:
        now = datetime.now(timezone.utc)
        doc = {
            "tenant_id": ObjectId(tenant_id),
            "name": name,
            "description": description,
            "created_at": now,
            "updated_at": now,
        }
        result = await cls._col().insert_one(doc)
        return str(result.inserted_id)

    @classmethod
    async def add_indication(
        cls,
        tenant_id: str,
        therapeutic_area_id: str,
        name: str,
        code: Optional[str] = None,
        description: Optional[str] = None,
    ) -> str:
        try:
            taid = ObjectId(therapeutic_area_id)
            tid = ObjectId(tenant_id)
        except Exception:
            raise ValueError("Invalid ids")
        existing = await cls._col().find_one({"_id": taid, "tenant_id": tid})
        if not existing:
            raise ValueError("Therapeutic area not found")
        return await insert_indication_document(
            tenant_id=tenant_id,
            therapeutic_area_id=therapeutic_area_id,
            name=name,
            code=code,
            description=description,
        )

    @classmethod
    async def remove_indication(
        cls,
        tenant_id: str,
        indication_id: str,
    ) -> bool:
        return await delete_indication_document(tenant_id, indication_id)

    @classmethod
    async def list_for_tenant(
        cls,
        tenant_id: str,
        page: int = 1,
        limit: int = 50,
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
            .sort("name", 1)
            .skip(skip)
            .limit(limit)
        )
        items = await cursor.to_list(length=limit)
        return items, total

    @classmethod
    async def get_by_id(cls, tenant_id: str, therapeutic_area_id: str) -> Optional[dict[str, Any]]:
        try:
            oid = ObjectId(therapeutic_area_id)
            tid = ObjectId(tenant_id)
        except Exception:
            return None
        return await cls._col().find_one({"_id": oid, "tenant_id": tid})

    @classmethod
    async def update(
        cls,
        tenant_id: str,
        therapeutic_area_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
    ) -> bool:
        try:
            oid = ObjectId(therapeutic_area_id)
            tid = ObjectId(tenant_id)
        except Exception:
            return False
        update: dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
        if name is not None:
            update["name"] = name
        if description is not None:
            update["description"] = description
        result = await cls._col().update_one(
            {"_id": oid, "tenant_id": tid},
            {"$set": update},
        )
        return result.modified_count > 0

    @classmethod
    async def delete(cls, tenant_id: str, therapeutic_area_id: str) -> bool:
        try:
            oid = ObjectId(therapeutic_area_id)
            tid = ObjectId(tenant_id)
        except Exception:
            return False
        ind_col = get_database()["indications"]
        await ind_col.delete_many(
            {"tenant_id": tid, "therapeutic_area_id": oid}
        )
        result = await cls._col().delete_one({"_id": oid, "tenant_id": tid})
        return result.deleted_count > 0
