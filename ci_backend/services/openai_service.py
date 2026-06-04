import json
from typing import Any, List

from openai import AsyncOpenAI

from config import get_settings
from prompts.financials_prompt import FINANCIALS_SYSTEM, FINANCIALS_USER
from prompts.highlights_prompt import KEY_HIGHLIGHTS_SYSTEM, KEY_HIGHLIGHTS_USER
from prompts.product_profile_prompt import PRODUCT_PROFILE_SYSTEM, PRODUCT_PROFILE_USER


def _client() -> AsyncOpenAI:
    settings = get_settings()
    return AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def generate_key_highlights(title: str, source_url: str, content: str) -> str:
    user = KEY_HIGHLIGHTS_USER(title, source_url) + (content or "")
    client = _client()
    resp = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": KEY_HIGHLIGHTS_SYSTEM},
            {"role": "user", "content": user},
        ],
        temperature=0.3,
    )
    return (resp.choices[0].message.content or "").strip()


async def generate_product_profile(cl_json: Any) -> str:
    payload = cl_json if isinstance(cl_json, str) else json.dumps(cl_json, default=str)
    user = PRODUCT_PROFILE_USER(payload)
    client = _client()
    resp = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": PRODUCT_PROFILE_SYSTEM},
            {"role": "user", "content": user},
        ],
        temperature=0.2,
    )
    return (resp.choices[0].message.content or "").strip()


async def generate_competitor_financials(company_name: str) -> str:
    user = FINANCIALS_USER(company_name)
    client = _client()
    resp = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": FINANCIALS_SYSTEM},
            {"role": "user", "content": user},
        ],
        temperature=0.3,
    )
    return (resp.choices[0].message.content or "").strip()


async def chat_completion(history: List[dict[str, str]], system_prompt: str) -> str:
    client = _client()
    messages: List[dict[str, str]] = [{"role": "system", "content": system_prompt}]
    for turn in history:
        role = turn.get("role", "user")
        content = turn.get("content", "")
        if role in ("user", "assistant", "system"):
            messages.append({"role": role, "content": content})
    resp = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        temperature=0.4,
    )
    return (resp.choices[0].message.content or "").strip()
