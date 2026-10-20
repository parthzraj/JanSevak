"""Application settings, read from environment variables / a local `.env` file."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

INSECURE_DEFAULT_SECRET = "change-this-to-a-random-secret-key-in-production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = "sqlite:///./prajapulse.db"
    SECRET_KEY: str = INSECURE_DEFAULT_SECRET
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    AI_SERVICE_URL: str = "http://localhost:8001"
    AI_TIMEOUT_SECONDS: float = 120.0  # local LLMs can be slow
    AI_PROXY_REQUIRE_AUTH: bool = False

    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_MB: int = 10

    CORS_ORIGINS: str = "*"  # comma separated list, or "*"

    DAILY_POINTS_CAP: int = 60
    DAY_RESET_TZ: str = "Asia/Kolkata"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()] or ["*"]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
