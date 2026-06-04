from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient

from config import get_settings
from models import ensure_all_indexes, set_database
from routes.auth_routes import router as auth_router
from routes.chatbot_routes import router as chatbot_router
from routes.clinical_trial_routes import router as clinical_trial_router
from routes.competitive_landscape_routes import router as competitive_landscape_router
from routes.competitors_routes import router as competitors_router
from routes.feedback_routes import router as feedback_router
from routes.log_routes import router as log_router
from routes.news_routes import router as news_router
from routes.notes_routes import router as notes_router
from routes.product_profile_routes import router as product_profile_router
from routes.profile_routes import router as profile_router
from routes.publications_routes import router as publications_router
from routes.report_routes import router as report_router
from routes.social_media_routes import router as social_media_router
from routes.superadmin_routes import router as superadmin_router
from routes.therapeutic_area_routes import router as therapeutic_area_router
from routes.timeline_routes import router as timeline_router
from routes.tenant_routes import router as tenant_router
from routes.user_routes import router as user_router

motor_client: Optional[AsyncIOMotorClient] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global motor_client
    settings = get_settings()
    motor_client = AsyncIOMotorClient(settings.MONGO_URI)
    db = motor_client[settings.DB_NAME]
    set_database(db)
    await ensure_all_indexes()
    yield
    if motor_client:
        motor_client.close()
        motor_client = None


def _cors_origins() -> list[str]:
    settings = get_settings()
    raw = settings.CORS_ORIGINS.strip()
    if raw == "*":
        return ["*"]
    return [o.strip() for o in raw.split(",") if o.strip()]


app = FastAPI(
    title="Competitive Intelligence API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_uploads = Path("uploads")
_uploads.mkdir(exist_ok=True)
(_uploads / "profile_photos").mkdir(exist_ok=True)
(_uploads / "reports").mkdir(exist_ok=True)

app.mount("/static", StaticFiles(directory=str(_uploads)), name="static")

API_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(superadmin_router, prefix=API_PREFIX)
app.include_router(tenant_router, prefix=API_PREFIX)
app.include_router(user_router, prefix=API_PREFIX)
app.include_router(therapeutic_area_router, prefix=API_PREFIX)
app.include_router(news_router, prefix=API_PREFIX)
app.include_router(social_media_router, prefix=API_PREFIX)
app.include_router(publications_router, prefix=API_PREFIX)
app.include_router(competitive_landscape_router, prefix=API_PREFIX)
app.include_router(product_profile_router, prefix=API_PREFIX)
app.include_router(clinical_trial_router, prefix=API_PREFIX)
app.include_router(competitors_router, prefix=API_PREFIX)
app.include_router(timeline_router, prefix=API_PREFIX)
app.include_router(report_router, prefix=API_PREFIX)
app.include_router(notes_router, prefix=API_PREFIX)
app.include_router(feedback_router, prefix=API_PREFIX)
app.include_router(chatbot_router, prefix=API_PREFIX)
app.include_router(log_router, prefix=API_PREFIX)
app.include_router(profile_router, prefix=API_PREFIX)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": str(exc),
            "code": "internal_error",
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Validation error",
            "code": "validation_error",
            "details": exc.errors(),
        },
    )


@app.get("/health")
async def health() -> dict[str, Any]:
    return {"status": "ok"}
