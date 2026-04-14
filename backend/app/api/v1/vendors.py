"""
VendGuard — Vendors API Controller
Endpoints:
  GET  /api/v1/vendors       — List all vendors with latest scores
  POST /api/v1/vendors       — Create a new vendor profile
  GET  /api/v1/vendors/{id}  — Get vendor detail with audit history
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.db_models import AuditReport, Vendor
from app.models.enums import AuditStatus
from app.models.schemas import VendorCreate, VendorList, VendorRead
from app.services.report_service import ReportService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/vendors", tags=["Vendors"])


@router.get(
    "",
    response_model=VendorList,
    summary="List all vendors with their latest risk scores",
)
async def list_vendors(db: AsyncSession = Depends(get_db)) -> VendorList:
    report_svc = ReportService(db)
    vendors_data = await report_svc.list_vendors_with_stats()

    vendors = [
        VendorRead(
            id=v["id"],
            name=v["name"],
            industry=v.get("industry"),
            website=v.get("website"),
            contact_email=v.get("contact_email"),
            created_at=v["created_at"],
            latest_score=v.get("latest_score"),
            latest_grade=v.get("latest_grade"),
            audit_count=v.get("audit_count", 0),
        )
        for v in vendors_data
    ]

    return VendorList(vendors=vendors, total=len(vendors))


@router.post(
    "",
    response_model=VendorRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new vendor profile",
)
async def create_vendor(
    payload: VendorCreate,
    db: AsyncSession = Depends(get_db),
) -> VendorRead:
    report_svc = ReportService(db)
    vendor = await report_svc.create_vendor(
        name=payload.name,
        industry=payload.industry,
        website=payload.website,
        contact_email=payload.contact_email,
    )
    return VendorRead(
        id=vendor.id,
        name=vendor.name,
        industry=vendor.industry,
        website=vendor.website,
        contact_email=vendor.contact_email,
        created_at=vendor.created_at,
        latest_score=None,
        latest_grade=None,
        audit_count=0,
    )


@router.get(
    "/{vendor_id}",
    response_model=dict,
    summary="Get vendor detail with full audit history",
)
async def get_vendor(
    vendor_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    report_svc = ReportService(db)
    vendor = await report_svc.get_vendor(vendor_id)

    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vendor {vendor_id!r} not found.",
        )

    # Fetch audit history
    result = await db.execute(
        select(AuditReport)
        .where(AuditReport.vendor_id == vendor_id)
        .order_by(AuditReport.created_at.desc())
        .limit(10)
    )
    reports = result.scalars().all()

    return {
        "id": vendor.id,
        "name": vendor.name,
        "industry": vendor.industry,
        "website": vendor.website,
        "contact_email": vendor.contact_email,
        "created_at": vendor.created_at.isoformat(),
        "audit_history": [
            {
                "report_id": r.id,
                "audit_name": r.audit_name,
                "status": r.status,
                "final_score": r.final_score,
                "grade": r.grade,
                "created_at": r.created_at.isoformat(),
                "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            }
            for r in reports
        ],
    }
