from typing import Any

import httpx

from config import get_settings


async def generate_report_pdf(payload: dict[str, Any]) -> bytes:
    settings = get_settings()
    if not settings.GAMMA_API_URL:
        raise RuntimeError("GAMMA_API_URL is not configured")
    headers = {
        "Authorization": f"Bearer {settings.GAMMA_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/pdf",
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            settings.GAMMA_API_URL,
            json=payload,
            headers=headers,
        )
        response.raise_for_status()
        return response.content
