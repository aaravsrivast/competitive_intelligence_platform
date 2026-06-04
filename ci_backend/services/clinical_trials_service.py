from typing import Any

import httpx


async def fetch_nct_details(nct_id: str) -> dict[str, Any]:
    clean = nct_id.strip().upper()
    if not clean.startswith("NCT"):
        clean = f"NCT{clean.replace('NCT', '')}"
    url = "https://clinicaltrials.gov/api/v2/studies"
    params = {"query.term": clean, "pageSize": 1}
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(url, params=params, headers={"Accept": "application/json"})
        response.raise_for_status()
        data = response.json()
    studies = data.get("studies") or []
    if not studies:
        raise ValueError(f"No study found for {clean}")
    return studies[0]
