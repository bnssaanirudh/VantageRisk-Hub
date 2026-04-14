"""
VendGuard — API v1 Router
Aggregates all v1 endpoints under a single prefix.
"""
from fastapi import APIRouter

from app.api.v1 import audit, vendors

router = APIRouter(prefix="/api/v1")

router.include_router(audit.router)
router.include_router(vendors.router)
