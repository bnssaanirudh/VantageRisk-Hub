"""
VendGuard — FastAPI Application Entry Point
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import router as api_v1_router
from app.api.v1.auth import router as auth_router
from app.config import get_settings
from app.core.database import init_db

settings = get_settings()

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("vendguard")


# ── Lifespan ───────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup / shutdown lifecycle hooks."""
    logger.info("═══ VendGuard API starting up ═══")
    await init_db()
    logger.info("Database tables verified ✓")
    yield
    logger.info("═══ VendGuard API shutting down ═══")


# ── Application ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="VendGuard API",
    description=(
        "Agentic AI platform for automated vendor risk assessments. "
        "Powered by Gemini 1.5 Pro + RAG + Deterministic Scoring."
    ),
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── Middleware ─────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ── Routers ────────────────────────────────────────────────────────────────────

app.include_router(api_v1_router)
app.include_router(auth_router)


# ── Health Check ───────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"], summary="Health check endpoint")
async def health() -> JSONResponse:
    return JSONResponse(
        content={
            "status": "healthy",
            "version": settings.app_version,
            "model": settings.gemini_model,
            "environment": settings.environment,
        }
    )


@app.get("/", tags=["System"], include_in_schema=False)
async def root() -> JSONResponse:
    return JSONResponse(
        content={
            "name": "VendGuard API",
            "version": settings.app_version,
            "docs": "/docs",
        }
    )
