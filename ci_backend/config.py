from functools import lru_cache
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    MONGO_URI: str = Field(..., description="MongoDB connection URI")
    DB_NAME: str = Field(..., description="Database name")
    JWT_SECRET: str = Field(..., min_length=16)
    OPENAI_API_KEY: str = Field(..., description="OpenAI API key")
    GAMMA_API_KEY: str = Field(..., description="Gamma API key for PDF generation")
    GAMMA_API_URL: Optional[str] = Field(
        default=None,
        description="Gamma PDF generation endpoint (full URL)",
    )

    CORS_ORIGINS: str = Field(
        default="*",
        description="Comma-separated origins or * for dev",
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, ge=5)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, ge=1)

    SENDGRID_API_KEY: Optional[str] = None
    EMAIL_FROM: Optional[str] = None
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = Field(default=587)
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

    PROFILE_UPLOAD_DIR: str = Field(default="uploads/profile_photos")
    PUBLIC_BASE_URL: str = Field(default="http://localhost:8000")


@lru_cache
def get_settings() -> Settings:
    return Settings()
