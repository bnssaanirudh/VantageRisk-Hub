"""
VendGuard — Report Assembly & Persistence Service
Assembles the final AuditResponse and persists it to the database.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db_models import AuditReport, ControlFinding, Vendor
from app.models.enums import AuditStatus, RiskGrade
from app.models.schemas import AuditResponse, ControlResult, ScoreBreakdown, VendorRead

logger = logging.getLogger(__name__)


class ReportService:
    """
    Owns the persistence and assembly of audit reports.
    No AI calls happen here — this service is purely about data management.
    """

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    # ── Vendor Operations ──────────────────────────────────────────────────────

    async def create_vendor(self, name: str, industry: str | None = None, **kwargs) -> Vendor:
        vendor = Vendor(name=name, industry=industry, **kwargs)
        self._db.add(vendor)
        await self._db.flush()
        return vendor

    async def get_vendor(self, vendor_id: str) -> Vendor | None:
        result = await self._db.execute(select(Vendor).where(Vendor.id == vendor_id))
        return result.scalar_one_or_none()

    async def list_vendors_with_stats(self) -> list[dict]:
        """Returns vendors with their latest score and audit count."""
        vendors_result = await self._db.execute(select(Vendor))
        vendors = vendors_result.scalars().all()
        output = []
        for vendor in vendors:
            # Get latest completed report
            report_result = await self._db.execute(
                select(AuditReport)
                .where(
                    AuditReport.vendor_id == vendor.id,
                    AuditReport.status == AuditStatus.COMPLETED.value,
                )
                .order_by(AuditReport.completed_at.desc())
                .limit(1)
            )
            latest = report_result.scalar_one_or_none()

            count_result = await self._db.execute(
                select(func.count(AuditReport.id)).where(AuditReport.vendor_id == vendor.id)
            )
            audit_count = count_result.scalar_one()

            output.append({
                "id": vendor.id,
                "name": vendor.name,
                "industry": vendor.industry,
                "website": vendor.website,
                "contact_email": vendor.contact_email,
                "created_at": vendor.created_at,
                "latest_score": latest.final_score if latest else None,
                "latest_grade": latest.grade if latest else None,
                "audit_count": audit_count,
            })
        return output

    # ── Audit Report Operations ────────────────────────────────────────────────

    async def create_report_record(
        self,
        vendor_id: str,
        audit_name: str,
        document_name: str,
        document_id: str,
        audit_lens: str = "SECURITY",
    ) -> AuditReport:
        """Create a PENDING audit report record (before AI processing)."""
        report = AuditReport(
            vendor_id=vendor_id,
            audit_name=audit_name,
            status=AuditStatus.PENDING.value,
            audit_lens=audit_lens,
            document_name=document_name,
            document_id=document_id,
        )
        self._db.add(report)
        await self._db.flush()
        logger.info("Created audit report record: id=%s", report.id)
        return report

    async def mark_report_status(
        self,
        report_id: str,
        status: AuditStatus,
    ) -> None:
        result = await self._db.execute(
            select(AuditReport).where(AuditReport.id == report_id)
        )
        report = result.scalar_one_or_none()
        if report:
            report.status = status.value
            await self._db.flush()

    async def finalize_report(
        self,
        report_id: str,
        vendor: Vendor,
        control_results: list[ControlResult],
        score_breakdown: ScoreBreakdown,
        executive_summary: str,
        document_pages: int,
        total_chunks: int,
    ) -> AuditResponse:
        """
        Persist all findings and return a fully assembled AuditResponse.
        """
        # Fetch the report
        result = await self._db.execute(
            select(AuditReport).where(AuditReport.id == report_id)
        )
        report = result.scalar_one()

        # Update report fields
        report.status = AuditStatus.COMPLETED.value
        report.final_score = score_breakdown.final_score
        report.grade = score_breakdown.grade.value
        report.score_breakdown = score_breakdown.model_dump()
        report.executive_summary = executive_summary
        report.document_pages = document_pages
        report.total_chunks = total_chunks
        report.completed_at = datetime.now(timezone.utc)

        # Persist control findings
        for cr in control_results:
            finding = ControlFinding(
                report_id=report.id,
                control_id=cr.control_id.value,
                control_name=cr.control_name,
                status=cr.status.value,
                risk_level=cr.risk_level.value,
                summary=cr.summary,
                evidence=cr.evidence,
                penalty_applied=cr.penalty_applied,
                recommendations=cr.recommendations,
                citations=[c.model_dump() for c in cr.citations],
            )
            self._db.add(finding)

        await self._db.flush()
        logger.info(
            "Finalized report id=%s | score=%.1f | grade=%s",
            report.id,
            score_breakdown.final_score,
            score_breakdown.grade.value,
        )

        # Assemble response
        return AuditResponse(
            report_id=UUID(report.id),
            vendor_id=UUID(vendor.id),
            vendor_name=vendor.name,
            audit_name=report.audit_name,
            audit_lens=AuditLens(report.audit_lens),
            status=AuditStatus.COMPLETED,
            document_name=report.document_name,
            document_pages=document_pages,
            total_chunks=total_chunks,
            control_results=control_results,
            score_breakdown=score_breakdown,
            executive_summary=executive_summary,
            created_at=report.created_at,
            completed_at=report.completed_at,
        )

    async def get_report(self, report_id: str) -> AuditResponse | None:
        """Fetch a completed report from the database."""
        result = await self._db.execute(
            select(AuditReport).where(AuditReport.id == report_id)
        )
        report = result.scalar_one_or_none()
        if not report:
            return None

        vendor = await self.get_vendor(report.vendor_id)
        if not vendor:
            return None

        # Load control findings
        findings_result = await self._db.execute(
            select(ControlFinding).where(ControlFinding.report_id == report_id)
        )
        findings = findings_result.scalars().all()

        from app.models.enums import ControlStatus, RequiredControl, RiskLevel, AuditLens
        from app.models.schemas import ControlResult, SourceCitation

        control_results = [
            ControlResult(
                control_id=RequiredControl(f.control_id),
                control_name=f.control_name,
                status=ControlStatus(f.status),
                risk_level=RiskLevel(f.risk_level),
                summary=f.summary,
                evidence=f.evidence,
                citations=[SourceCitation(**c) for c in (f.citations or [])],
                recommendations=f.recommendations or [],
                penalty_applied=f.penalty_applied,
            )
            for f in findings
        ]

        sb_data = report.score_breakdown or {}
        score_breakdown = ScoreBreakdown(**sb_data) if sb_data else None

        if score_breakdown is None:
            return None

        return AuditResponse(
            report_id=UUID(report.id),
            vendor_id=UUID(report.vendor_id),
            vendor_name=vendor.name,
            audit_name=report.audit_name,
            audit_lens=AuditLens(report.audit_lens),
            status=AuditStatus(report.status),
            document_name=report.document_name,
            document_pages=report.document_pages,
            total_chunks=report.total_chunks,
            control_results=control_results,
            score_breakdown=score_breakdown,
            executive_summary=report.executive_summary or "",
            created_at=report.created_at,
            completed_at=report.completed_at,
        )
