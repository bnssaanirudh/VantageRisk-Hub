"""
VendGuard — API v1 Router
Aggregates all v1 endpoints under a single prefix.
"""
from fastapi import APIRouter

from app.api.v1 import audit, vendors
from app.api.v1.auth import router as auth_router

router = APIRouter(prefix="/api/v1")

router.include_router(audit.router)
router.include_router(vendors.router)

# Auth router already has /api/v1/auth prefix, so mount at root level
# We'll handle this in main.py instead
