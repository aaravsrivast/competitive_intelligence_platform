import smtplib
from email.message import EmailMessage
from pathlib import Path
from typing import Any

import httpx
from jinja2 import Environment, FileSystemLoader, select_autoescape

from config import get_settings

_env = Environment(
    loader=FileSystemLoader(str(Path(__file__).resolve().parent.parent / "templates")),
    autoescape=select_autoescape(["html", "xml"]),
)


async def send_article_email(to: str, article: dict[str, Any]) -> None:
    settings = get_settings()
    html = _env.get_template("article_email.html").render(
        title=article.get("title") or "",
        company=article.get("company") or "",
        source_url=article.get("source_url") or "",
        content=article.get("content") or "",
    )
    subject = str(article.get("title") or "Article share")

    if settings.SENDGRID_API_KEY and settings.EMAIL_FROM:
        await _send_sendgrid_html(to, subject, html)
        return

    if settings.SMTP_HOST and settings.EMAIL_FROM:
        await _send_smtp_html(to, subject, html)
        return

    raise RuntimeError("Email is not configured (SendGrid or SMTP)")


async def _send_sendgrid_html(to: str, subject: str, html: str) -> None:
    settings = get_settings()
    payload = {
        "personalizations": [{"to": [{"email": to}]}],
        "from": {"email": settings.EMAIL_FROM},
        "subject": subject,
        "content": [{"type": "text/html", "value": html}],
    }
    headers = {
        "Authorization": f"Bearer {settings.SENDGRID_API_KEY}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            "https://api.sendgrid.com/v3/mail/send",
            json=payload,
            headers=headers,
        )
        r.raise_for_status()


async def _send_smtp_html(to: str, subject: str, html: str) -> None:
    settings = get_settings()
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to
    msg.set_content("This email requires an HTML-capable client.")
    msg.add_alternative(html, subtype="html")

    def _send_sync() -> None:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)

    await _run_in_thread(_send_sync)


async def _run_in_thread(fn) -> Any:
    import asyncio

    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, fn)
