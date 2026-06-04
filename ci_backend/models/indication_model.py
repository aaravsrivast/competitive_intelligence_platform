from datetime import datetime, timezone
from typing import Any, List, Optional

from bson import ObjectId

from models import get_database


async def insert_indication_document(
    tenant_id: str,
    therapeutic_area_id: str,
    name: str,
    code: Optional[str] = None,
    description: Optional[str] = None,
) -> str:
    now = datetime.now(timezone.utc)
    doc = {
        "tenant_id": ObjectId(tenant_id),
        "therapeutic_area_id": ObjectId(therapeutic_area_id),
        "name": name,
        "code": code,
        "description": description,
        "created_at": now,
        "updated_at": now,
    }
    col = get_database()["indications"]
    result = await col.insert_one(doc)
    return str(result.inserted_id)


async def delete_indication_document(
    tenant_id: str,
    indication_id: str,
) -> bool:
    try:
        oid = ObjectId(indication_id)
        tid = ObjectId(tenant_id)
    except Exception:
        return False
    col = get_database()["indications"]
    result = await col.delete_one({"_id": oid, "tenant_id": tid})
    return result.deleted_count > 0


class IndicationModel:
    collection_name = "indications"

    @classmethod
    def _col(cls):
        return get_database()[cls.collection_name]

    @classmethod
    async def ensure_indexes(cls) -> None:
        col = cls._col()
        await col.create_index([("tenant_id", 1), ("therapeutic_area_id", 1)])
        await col.create_index("name")

    @classmethod
    async def create(
        cls,
        tenant_id: str,
        therapeutic_area_id: str,
        name: str,
        code: Optional[str] = None,
        description: Optional[str] = None,
    ) -> str:
        return await insert_indication_document(
            tenant_id=tenant_id,
            therapeutic_area_id=therapeutic_area_id,
            name=name,
            code=code,
            description=description,
        )

    @classmethod
    async def list_for_therapeutic_area(
        cls,
        tenant_id: str,
        therapeutic_area_id: str,
    ) -> List[dict[str, Any]]:
        try:
            tid = ObjectId(tenant_id)
            taid = ObjectId(therapeutic_area_id)
        except Exception:
            return []
        cursor = cls._col().find(
            {"tenant_id": tid, "therapeutic_area_id": taid}
        ).sort("name", 1)
        return await cursor.to_list(length=500)

    @classmethod
    async def get_by_id(
        cls,
        tenant_id: str,
        indication_id: str,
    ) -> Optional[dict[str, Any]]:
        try:
            oid = ObjectId(indication_id)
            tid = ObjectId(tenant_id)
        except Exception:
            return None
        return await cls._col().find_one({"_id": oid, "tenant_id": tid})

    @classmethod
    async def delete(cls, tenant_id: str, indication_id: str) -> bool:
        return await delete_indication_document(tenant_id, indication_id)
