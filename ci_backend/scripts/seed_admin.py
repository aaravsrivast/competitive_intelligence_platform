#!/usr/bin/env python3
"""
Create a superadmin user for local development.

Usage (from ci_backend/ with venv active):
  python scripts/seed_admin.py --email admin@example.com --password 'YourSecurePass1'
"""
from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient

from config import get_settings
from models import ensure_all_indexes, set_database
from models.user_model import UserModel
async def main() -> None:
    parser = argparse.ArgumentParser(description="Seed a superadmin user")
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    args = parser.parse_args()
    if len(args.password) < 8:
        parser.error("password must be at least 8 characters")

    env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.is_file():
        print(
            "Missing ci_backend/.env — copy from .env.example:\n"
            "  cp .env.example .env\n"
            "Then set MONGO_URI, DB_NAME, JWT_SECRET, OPENAI_API_KEY, and GAMMA_API_KEY.",
            file=sys.stderr,
        )
        sys.exit(1)

    settings = get_settings()
    client = AsyncIOMotorClient(settings.MONGO_URI)
    set_database(client[settings.DB_NAME])
    await ensure_all_indexes()

    existing = await UserModel.get_by_email(args.email)
    if existing:
        print(f"User already exists: {args.email} (role={existing.get('role')})")
        return

    uid = await UserModel.create(
        email=args.email,
        password=args.password,
        role="superadmin",
        tenant_id=None,
        first_name="Super",
        last_name="Admin",
    )
    print(f"Created superadmin {args.email} (id={uid})")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
