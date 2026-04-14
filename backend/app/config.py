"""
VendGuard — Application Configuration
Centralised settings via pydantic-settings. All values are loaded from
environment variables / .env file. Never hardcode secrets.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ───────────────────────────────────────────────────────────────────
    app_name: str = "VendGuard"
    app_version: str = "0.1.0"
    debug: bool = False
    environment: str = Field(default="development", pattern="^(development|staging|production)$")

    # ── Database ──────────────────────────────────────────────────────────────
    # SQLite for local dev; swap to postgresql+asyncpg://... for production
    database_url: str = "sqlite+aiosqlite:///./vendguard.db"

    # ── Vector Store ──────────────────────────────────────────────────────────
    faiss_index_path: str = "./faiss_index"
    embedding_dimension: int = 768          # text-embedding-004 output dim

    # ── Gemini / LangChain ────────────────────────────────────────────────────
    gemini_api_key: str = Field(..., description="Google AI Studio API key")
    gemini_model: str = "gemini-1.5-pro"
    gemini_temperature: float = Field(default=0.0, ge=0.0, le=1.0)
    embedding_model: str = "models/text-embedding-004"

    # ── RAG / Chunking ────────────────────────────────────────────────────────
    chunk_size: int = 1000
    chunk_overlap: int = 200
    retrieval_k: int = 8                    # top-k chunks per control query

    # ── Scoring ───────────────────────────────────────────────────────────────
    critical_penalty: int = 15             # points deducted per critical gap
    high_penalty: int = 10
    medium_penalty: int = 5

    # ── CORS ──────────────────────────────────────────────────────────────────
    allowed_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # ── File Upload ───────────────────────────────────────────────────────────
    max_upload_size_mb: int = 50
    upload_dir: str = "./uploads"

    @field_validator("upload_dir", mode="after")
    @classmethod
    def create_upload_dir(cls, v: str) -> str:
        Path(v).mkdir(parents=True, exist_ok=True)
        return v

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Cached singleton — import and call anywhere."""
    return Settings()  # type: ignore[call-arg]
