from collections import defaultdict
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from bson.regex import Regex

from models import get_database


class CompetitiveLandscapeModel:
    collection_name = "competitive_landscape"

    @classmethod
    def _col(cls):
        return get_database()[cls.collection_name]

    @classmethod
    async def ensure_indexes(cls) -> None:
        col = cls._col()
        await col.create_index("tenant_id")
        await col.create_index([("tenant_id", 1), ("indication_id", 1)])
        await col.create_index([("tenant_id", 1), ("company", 1)])
        await col.create_index([("tenant_id", 1), ("phase", 1)])
        await col.create_index([("tenant_id", 1), ("nct_id", 1)])

    @classmethod
    async def create(
        cls,
        tenant_id: str,
        company: str,
        competitor_asset: str,
        indication_id: str,
        phase: str,
        roa: Optional[str] = None,
        moa: Optional[str] = None,
        dosing: Optional[str] = None,
        line_of_therapy: Optional[str] = None,
        notes: Optional[str] = None,
        sub_indication: Optional[str] = None,
        formulation: Optional[str] = None,
        target_population: Optional[str] = None,
        study_name: Optional[str] = None,
        nct_id: Optional[str] = None,
        timeline: Optional[dict[str, Any]] = None,
        priority: Optional[str] = None,
        product_profile: Optional[str] = None,
    ) -> str:
        now = datetime.now(timezone.utc)
        doc = {
            "tenant_id": ObjectId(tenant_id),
            "company": company,
            "competitor_asset": competitor_asset,
            "indication_id": ObjectId(indication_id),
            "phase": phase,
            "roa": roa,
            "moa": moa,
            "dosing": dosing,
            "line_of_therapy": line_of_therapy,
            "notes": notes,
            "sub_indication": sub_indication,
            "formulation": formulation,
            "target_population": target_population,
            "study_name": study_name,
            "nct_id": nct_id,
            "timeline": timeline or {},
            "priority": priority or "normal",
            "product_profile": product_profile,
            "created_at": now,
            "updated_at": now,
        }
        result = await cls._col().insert_one(doc)
        return str(result.inserted_id)

    @classmethod
    def _list_filter(
        cls,
        tenant_id: str,
        indication_id: Optional[str] = None,
        company: Optional[str] = None,
        phase: Optional[str] = None,
        sub_indication: Optional[str] = None,
        priority: Optional[str] = None,
    ) -> dict[str, Any]:
        try:
            tid = ObjectId(tenant_id)
        except Exception:
            return {"_id": None}
        q: dict[str, Any] = {"tenant_id": tid}
        if indication_id:
            q["indication_id"] = ObjectId(indication_id)
        if company:
            q["company"] = Regex(company, "i")
        if phase:
            q["phase"] = phase
        if sub_indication:
            q["sub_indication"] = Regex(sub_indication, "i")
        if priority:
            q["priority"] = priority
        return q

    @classmethod
    async def list_with_filters(
        cls,
        tenant_id: str,
        indication_id: Optional[str] = None,
        company: Optional[str] = None,
        phase: Optional[str] = None,
        sub_indication: Optional[str] = None,
        priority: Optional[str] = None,
        page: int = 1,
        limit: int = 50,
    ) -> tuple[list[dict[str, Any]], int]:
        query = cls._list_filter(
            tenant_id,
            indication_id,
            company,
            phase,
            sub_indication,
            priority,
        )
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
    async def get_by_id(cls, tenant_id: str, card_id: str) -> Optional[dict[str, Any]]:
        try:
            oid = ObjectId(card_id)
            tid = ObjectId(tenant_id)
        except Exception:
            return None
        return await cls._col().find_one({"_id": oid, "tenant_id": tid})

    @classmethod
    async def update_phase(cls, tenant_id: str, card_id: str, new_phase: str) -> bool:
        try:
            oid = ObjectId(card_id)
            tid = ObjectId(tenant_id)
        except Exception:
            return False
        result = await cls._col().update_one(
            {"_id": oid, "tenant_id": tid},
            {
                "$set": {
                    "phase": new_phase,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        return result.modified_count > 0

    @classmethod
    async def update(
        cls,
        tenant_id: str,
        card_id: str,
        fields: dict[str, Any],
    ) -> bool:
        try:
            oid = ObjectId(card_id)
            tid = ObjectId(tenant_id)
        except Exception:
            return False
        allowed = {
            "company",
            "competitor_asset",
            "roa",
            "moa",
            "phase",
            "dosing",
            "line_of_therapy",
            "notes",
            "sub_indication",
            "formulation",
            "target_population",
            "study_name",
            "nct_id",
            "timeline",
            "priority",
            "product_profile",
        }
        update: dict[str, Any] = {}
        for k, v in fields.items():
            if k in allowed and v is not None:
                update[k] = v
        if "indication_id" in fields and fields["indication_id"] is not None:
            update["indication_id"] = ObjectId(fields["indication_id"])
        if not update:
            return False
        update["updated_at"] = datetime.now(timezone.utc)
        result = await cls._col().update_one(
            {"_id": oid, "tenant_id": tid},
            {"$set": update},
        )
        return result.modified_count > 0

    @classmethod
    async def delete(cls, tenant_id: str, card_id: str) -> bool:
        try:
            oid = ObjectId(card_id)
            tid = ObjectId(tenant_id)
        except Exception:
            return False
        result = await cls._col().delete_one({"_id": oid, "tenant_id": tid})
        return result.deleted_count > 0

    @classmethod
    async def get_kanban_view(
        cls,
        tenant_id: str,
        indication_id: str,
    ) -> Dict[str, List[dict[str, Any]]]:
        try:
            tid = ObjectId(tenant_id)
            iid = ObjectId(indication_id)
        except Exception:
            return {}
        cursor = cls._col().find({"tenant_id": tid, "indication_id": iid})
        items = await cursor.to_list(length=10000)
        grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for doc in items:
            ph = str(doc.get("phase") or "Unknown")
            grouped[ph].append(doc)
        return dict(grouped)

    @classmethod
    async def distinct_companies(cls, tenant_id: str) -> List[str]:
        try:
            tid = ObjectId(tenant_id)
        except Exception:
            return []
        return await cls._col().distinct("company", {"tenant_id": tid})

    @classmethod
    async def quarterly_timeline(
        cls,
        tenant_id: str,
        indication_id: Optional[str] = None,
        company: Optional[str] = None,
    ) -> List[dict[str, Any]]:
        try:
            tid = ObjectId(tenant_id)
        except Exception:
            return []
        q: dict[str, Any] = {"tenant_id": tid}
        if indication_id:
            q["indication_id"] = ObjectId(indication_id)
        if company:
            q["company"] = Regex(company, "i")
        cursor = cls._col().find(q)
        cards = await cursor.to_list(length=50000)
        today = date.today()
        cy, cm = today.year, today.month
        cq = (cm - 1) // 3 + 1
        ordered_keys: list[tuple[int, int]] = []
        y, q = cy, cq
        for _ in range(80):
            ordered_keys.append((y, q))
            q -= 1
            if q == 0:
                q = 4
                y -= 1
        buckets: dict[tuple[int, int], list[dict[str, Any]]] = defaultdict(list)
        for key in ordered_keys:
            buckets[key] = []
        for card in cards:
            placed = False
            events = []
            tl = card.get("timeline") or {}
            if isinstance(tl, dict):
                events = tl.get("events") or []
            for ev in events:
                if not isinstance(ev, dict):
                    continue
                ds = ev.get("date") or ev.get("on")
                if not ds:
                    continue
                try:
                    if isinstance(ds, datetime):
                        d = ds.date()
                    else:
                        d = date.fromisoformat(str(ds)[:10])
                except Exception:
                    continue
                qn = (d.month - 1) // 3 + 1
                key = (d.year, qn)
                if key in buckets:
                    buckets[key].append({"card": card, "event": ev})
                    placed = True
            if not placed:
                ca = card.get("updated_at") or card.get("created_at")
                if isinstance(ca, datetime):
                    d = ca.date()
                    qn = (d.month - 1) // 3 + 1
                    key = (d.year, qn)
                    if key in buckets:
                        buckets[key].append({"card": card, "event": None})
        out: list[dict[str, Any]] = []
        for year, quarter in ordered_keys:
            label = f"{year} Q{quarter}"
            raw_items = buckets.get((year, quarter), [])
            items: list[dict[str, Any]] = []
            for it in raw_items:
                c = it["card"]
                items.append(
                    {
                        "company": c.get("company"),
                        "competitor_asset": c.get("competitor_asset"),
                        "phase": c.get("phase"),
                        "nct_id": c.get("nct_id"),
                        "event": it.get("event"),
                    }
                )
            out.append(
                {
                    "year": year,
                    "quarter": quarter,
                    "label": label,
                    "items": items,
                }
            )
        return out
