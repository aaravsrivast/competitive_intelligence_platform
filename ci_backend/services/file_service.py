import os
import uuid
from pathlib import Path

import aiofiles
from fastapi import UploadFile

from config import get_settings


ALLOWED_MIME = {"image/jpeg", "image/png"}


async def upload_profile_photo(file: UploadFile) -> str:
    if file.content_type not in ALLOWED_MIME:
        raise ValueError("Only image/jpeg and image/png are allowed")
    settings = get_settings()
    base = Path(settings.PROFILE_UPLOAD_DIR)
    base.mkdir(parents=True, exist_ok=True)
    ext = ".jpg" if file.content_type == "image/jpeg" else ".png"
    name = f"{uuid.uuid4().hex}{ext}"
    dest = base / name
    async with aiofiles.open(dest, "wb") as out:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            await out.write(chunk)
    public = settings.PUBLIC_BASE_URL.rstrip("/")
    return f"{public}/static/profile_photos/{name}"
