from datetime import datetime, timezone
from typing import Any, Optional, Tuple

from bson import ObjectId
from bson.regex import Regex

from models import get_database


class PublicationModel:
    collection_name = "publications"

    @classmethod
    def _col(cls):
        return get_database()[cls.collection_name]

    @classmethod
    async def ensure_indexes(cls) -> None:
        col = cls._col()
        await col.create_index("tenant_id")
        await col.create_index([("tenant_id", 1), ("published_at", -1)])
        await col.create_index([("tenant_id", 1), ("company", 1)])
        await col.create_index([("tenant_id", 1), ("priority", 1)])

    @classmethod
    async def create(
        cls,
        tenant_id: str,
        title: str,
        content: str,
        source_url: Optional[str] = None,
        company: Optional[str] = None,
        priority: Optional[str] = None,
        published_at: Optional[datetime] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> str:
        now = datetime.now(timezone.utc)
        doc = {
            "tenant_id": ObjectId(tenant_id),
            "title": title,
            "content": content,
            "source_url": source_url,
            "company": company,
            "priority": priority or "normal",
            "published_at": published_at or now,
            "highlights": None,
            "metadata": metadata or {},
            "created_at": now,
            "updated_at": now,
        }
        result = await cls._col().insert_one(doc)
        return str(result.inserted_id)

    @classmethod
    def _base_filter(
        cls,
        tenant_id: str,
        date_range: Optional[Tuple[Optional[datetime], Optional[datetime]]] = None,
        priority: Optional[str] = None,
        company: Optional[str] = None,
        search: Optional[str] = None,
    ) -> dict[str, Any]:
        try:
            tid = ObjectId(tenant_id)
        except Exception:
            return {"_id": None}
        q: dict[str, Any] = {"tenant_id": tid}
        if date_range:
            start, end = date_range
            dr: dict[str, Any] = {}
            if start:
                dr["$gte"] = start
            if end:
                dr["$lte"] = end
            if dr:
                q["published_at"] = dr
        if priority:
            q["priority"] = priority
        if company:
            q["company"] = Regex(f"^{Regex.escape(company)}$", "i")
        if search:
            q["$or"] = [
                {"title": Regex(search, "i")},
                {"content": Regex(search, "i")},
                {"company": Regex(search, "i")},
            ]
        return q

    @classmethod
    async def list_with_filters(
        cls,
        tenant_id: str,
        date_range: Optional[Tuple[Optional[datetime], Optional[datetime]]] = None,
        priority: Optional[str] = None,
        company: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[dict[str, Any]], int]:
        query = cls._base_filter(tenant_id, date_range, priority, company, search)
        skip = (page - 1) * limit
        total = await cls._col().count_documents(query)
        cursor = (
            cls._col()
            .find(query)
            .sort("published_at", -1)
            .skip(skip)
            .limit(limit)
        )
        items = await cursor.to_list(length=limit)
        return items, total

    @classmethod
    async def get_by_id(cls, tenant_id: str, publication_id: str) -> Optional[dict[str, Any]]:
        try:
            oid = ObjectId(publication_id)
            tid = ObjectId(tenant_id)
        except Exception:
            return None
        return await cls._col().find_one({"_id": oid, "tenant_id": tid})

    @classmethod
    async def update(
        cls,
        tenant_id: str,
        publication_id: str,
        fields: dict[str, Any],
    ) -> bool:
        try:
            oid = ObjectId(publication_id)
            tid = ObjectId(tenant_id)
        except Exception:
            return False
        fields = {k: v for k, v in fields.items() if v is not None}
        if not fields:
            return False
        fields["updated_at"] = datetime.now(timezone.utc)
        result = await cls._col().update_one(
            {"_id": oid, "tenant_id": tid},
            {"$set": fields},
        )
        return result.modified_count > 0

    @classmethod
    async def delete(cls, tenant_id: str, publication_id: str) -> bool:
        try:
            oid = ObjectId(publication_id)
            tid = ObjectId(tenant_id)
        except Exception:
            return False
        result = await cls._col().delete_one({"_id": oid, "tenant_id": tid})
        return result.deleted_count > 0

    @classmethod
    async def generate_highlights(cls, tenant_id: str, publication_id: str) -> str:
        from services.openai_service import generate_key_highlights

        pub = await cls.get_by_id(tenant_id, publication_id)
        if not pub:
            raise ValueError("Publication not found")
        text = await generate_key_highlights(
            title=pub.get("title") or "",
            source_url=pub.get("source_url") or "",
            content=pub.get("content") or "",
        )
        await cls._col().update_one(
            {"_id": ObjectId(publication_id), "tenant_id": ObjectId(tenant_id)},
            {
                "$set": {
                    "highlights": text,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        return text
