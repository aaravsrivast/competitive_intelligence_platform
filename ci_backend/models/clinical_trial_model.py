from datetime import datetime, timezone
from typing import Any, List, Optional

from bson import ObjectId
from bson.regex import Regex

from models import get_database


class ClinicalTrialModel:
    collection_name = "clinical_trials"

    @classmethod
    def _col(cls):
        return get_database()[cls.collection_name]

    @classmethod
    async def ensure_indexes(cls) -> None:
        col = cls._col()
        await col.create_index([("tenant_id", 1), ("nct_id", 1)], unique=True)
        await col.create_index("tenant_id")

    @classmethod
    async def upsert_from_nct(
        cls,
        tenant_id: str,
        nct_id: str,
        payload: dict[str, Any],
    ) -> str:
        now = datetime.now(timezone.utc)
        try:
            tid = ObjectId(tenant_id)
        except Exception:
            raise ValueError("Invalid tenant")
        normalized = nct_id.strip().upper()
        existing = await cls._col().find_one(
            {"tenant_id": tid, "nct_id": normalized}
        )
        doc = {
            "tenant_id": tid,
            "nct_id": normalized,
            "payload": payload,
            "synced_at": now,
            "updated_at": now,
        }
        if existing:
            await cls._col().update_one(
                {"_id": existing["_id"]},
                {"$set": {"payload": payload, "synced_at": now, "updated_at": now}},
            )
            return str(existing["_id"])
        doc["created_at"] = now
        result = await cls._col().insert_one(doc)
        return str(result.inserted_id)

    @classmethod
    async def get_by_id(cls, tenant_id: str, trial_id: str) -> Optional[dict[str, Any]]:
        try:
            oid = ObjectId(trial_id)
            tid = ObjectId(tenant_id)
        except Exception:
            return None
        return await cls._col().find_one({"_id": oid, "tenant_id": tid})

    @classmethod
    async def get_by_nct_id(cls, tenant_id: str, nct_id: str) -> Optional[dict[str, Any]]:
        try:
            tid = ObjectId(tenant_id)
        except Exception:
            return None
        return await cls._col().find_one(
            {"tenant_id": tid, "nct_id": nct_id.strip().upper()}
        )

    @classmethod
    async def list_with_filters(
        cls,
        tenant_id: str,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[dict[str, Any]], int]:
        try:
            tid = ObjectId(tenant_id)
        except Exception:
            return [], 0
        query: dict[str, Any] = {"tenant_id": tid}
        if search:
            query["nct_id"] = Regex(Regex.escape(search.strip()), "i")
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
