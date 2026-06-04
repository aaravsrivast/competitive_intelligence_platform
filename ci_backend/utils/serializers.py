from typing import Any, List

from bson import ObjectId

from utils.mongo_utils import serialize_document


def _oid_str(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, ObjectId):
        return str(value)
    return str(value)


def user_doc(doc: dict[str, Any]) -> dict[str, Any]:
    s = serialize_document(doc)
    s["therapeutic_area_ids"] = [
        str(x) for x in (doc.get("therapeutic_area_ids") or []) if x
    ]
    s["tenant_id"] = _oid_str(doc.get("tenant_id"))
    if "password_hash" in s:
        del s["password_hash"]
    return s


def tenant_doc(doc: dict[str, Any]) -> dict[str, Any]:
    s = serialize_document(doc)
    s["admin_user_ids"] = [str(x) for x in (doc.get("admin_user_ids") or [])]
    return s


def news_doc(doc: dict[str, Any]) -> dict[str, Any]:
    s = serialize_document(doc)
    s["tenant_id"] = _oid_str(doc.get("tenant_id"))
    return s


def social_doc(doc: dict[str, Any]) -> dict[str, Any]:
    s = serialize_document(doc)
    s["tenant_id"] = _oid_str(doc.get("tenant_id"))
    return s


def publication_doc(doc: dict[str, Any]) -> dict[str, Any]:
    s = serialize_document(doc)
    s["tenant_id"] = _oid_str(doc.get("tenant_id"))
    return s


def cl_doc(doc: dict[str, Any]) -> dict[str, Any]:
    s = serialize_document(doc)
    s["tenant_id"] = _oid_str(doc.get("tenant_id"))
    s["indication_id"] = _oid_str(doc.get("indication_id"))
    return s


def note_doc(doc: dict[str, Any]) -> dict[str, Any]:
    s = serialize_document(doc)
    s["tenant_id"] = _oid_str(doc.get("tenant_id"))
    s["user_id"] = _oid_str(doc.get("user_id"))
    ctx = doc.get("context_id")
    s["context_id"] = _oid_str(ctx) if ctx else None
    return s


def feedback_doc(doc: dict[str, Any]) -> dict[str, Any]:
    s = serialize_document(doc)
    s["tenant_id"] = _oid_str(doc.get("tenant_id"))
    s["user_id"] = _oid_str(doc.get("user_id"))
    ctx = doc.get("context_id")
    s["context_id"] = _oid_str(ctx) if ctx else None
    return s


def chat_msg_doc(doc: dict[str, Any]) -> dict[str, Any]:
    s = serialize_document(doc)
    s["tenant_id"] = _oid_str(doc.get("tenant_id"))
    s["user_id"] = _oid_str(doc.get("user_id"))
    ind = doc.get("indication_id")
    s["indication_id"] = _oid_str(ind) if ind else None
    return s


def log_doc(doc: dict[str, Any]) -> dict[str, Any]:
    s = serialize_document(doc)
    s["tenant_id"] = _oid_str(doc.get("tenant_id"))
    s["user_id"] = _oid_str(doc.get("user_id"))
    return s


def report_doc(doc: dict[str, Any]) -> dict[str, Any]:
    s = serialize_document(doc)
    s["tenant_id"] = _oid_str(doc.get("tenant_id"))
    s["created_by_user_id"] = _oid_str(doc.get("created_by_user_id"))
    return s


def clinical_trial_doc(doc: dict[str, Any]) -> dict[str, Any]:
    s = serialize_document(doc)
    s["tenant_id"] = _oid_str(doc.get("tenant_id"))
    return s


def therapeutic_area_doc(doc: dict[str, Any]) -> dict[str, Any]:
    s = serialize_document(doc)
    s["tenant_id"] = _oid_str(doc.get("tenant_id"))
    return s


def indication_doc(doc: dict[str, Any]) -> dict[str, Any]:
    s = serialize_document(doc)
    s["tenant_id"] = _oid_str(doc.get("tenant_id"))
    s["therapeutic_area_id"] = _oid_str(doc.get("therapeutic_area_id"))
    return s


def map_list(fn, docs: List[dict[str, Any]]) -> List[dict[str, Any]]:
    return [fn(d) for d in docs]
