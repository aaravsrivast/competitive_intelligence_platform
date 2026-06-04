#!/usr/bin/env python3
"""
Create a demo tenant + tenant admin for local development.

Usage (from ci_backend/ with venv active):
  python scripts/seed_tenant_admin.py
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient

from config import get_settings
from models import ensure_all_indexes, set_database
from models.tenant_model import TenantModel
from models.user_model import UserModel

EMAIL = "admin@demo.com"
PASSWORD = "DemoPass123"
TENANT_NAME = "Demo Pharma"
TENANT_SLUG = "demo-pharma"


async def main() -> None:
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.is_file():
        print("Missing ci_backend/.env — copy from .env.example first.", file=sys.stderr)
        sys.exit(1)

    settings = get_settings()
    client = AsyncIOMotorClient(settings.MONGO_URI)
    set_database(client[settings.DB_NAME])
    await ensure_all_indexes()

    existing = await UserModel.get_by_email(EMAIL)
    if existing:
        print(f"Tenant admin already exists: {EMAIL}")
        print(f"Password (if unchanged): {PASSWORD}")
        client.close()
        return

    tenant = await TenantModel._col().find_one({"slug": TENANT_SLUG})
    if tenant:
        tid = str(tenant["_id"])
    else:
        tid = await TenantModel.create(TENANT_NAME, TENANT_SLUG, {"plan": "enterprise", "status": "active"})
        print(f"Created tenant: {TENANT_NAME} ({tid})")

    uid = await UserModel.create(
        email=EMAIL,
        password=PASSWORD,
        role="admin",
        tenant_id=tid,
        first_name="Demo",
        last_name="Admin",
    )
    await TenantModel.assign_admin(tid, uid)
    print(f"Created tenant admin: {EMAIL}")
    print(f"Password: {PASSWORD}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
