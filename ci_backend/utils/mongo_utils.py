from datetime import datetime
from typing import Any

from bson import ObjectId


def serialize_value(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, dict):
        return {k: serialize_value(v) for k, v in value.items()}
    if isinstance(value, list):
        return [serialize_value(v) for v in value]
    return value


def serialize_document(doc: dict[str, Any]) -> dict[str, Any]:
    d = dict(doc)
    if "_id" in d:
        oid = d.pop("_id")
        d["id"] = str(oid) if isinstance(oid, ObjectId) else oid
    return serialize_value(d)
