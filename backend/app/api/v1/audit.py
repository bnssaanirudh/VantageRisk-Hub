"""
VendGuard — Audit API Controller
Endpoints:
  POST /api/v1/audit/upload   — Upload PDF for ingestion
  POST /api/v1/audit/run      — Run RAG + scoring on uploaded document
  GET  /api/v1/audit/{id}     — Retrieve a completed report
"""
from __future__ import annotations

import logging
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.database import get_db
from app.models.enums import AuditStatus
from app.models.schemas import AuditResponse, AuditRunRequest, AuditStatusResponse, UploadResponse
from app.services.ingestion_service import IngestionService
from app.services.rag_service import RAGService
from app.services.report_service import ReportService
from app.services.scoring_service import compute_risk_score

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/audit", tags=["Audit"])
settings = get_settings()


@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a vendor compliance PDF for ingestion",
)
async def upload_document(
    file: UploadFile = File(..., description="Vendor compliance PDF (max 50MB)"),
    vendor_id: str = Form(..., description="UUID of the vendor this document belongs to"),
    db: AsyncSession = Depends(get_db),
) -> UploadResponse:
    """
    Accepts a PDF upload, runs the ingestion pipeline (parse → chunk → embed → index),
    and returns a document_id for subsequent audit runs.
    """
    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF files are accepted.",
        )

    # Validate file size
    content = await file.read()
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size of {settings.max_upload_size_mb}MB.",
        )

    # Validate vendor exists
    report_svc = ReportService(db)
    vendor = await report_svc.get_vendor(vendor_id)
    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vendor with id={vendor_id!r} not found.",
        )

    # Save file to disk
    upload_path = Path(settings.upload_dir) / f"{vendor_id}_{file.filename}"
    upload_path.write_bytes(content)
    logger.info("Saved upload: %s (%d bytes)", upload_path, len(content))

    # Ingest
    try:
        ingestion_svc = IngestionService()
        result = await ingestion_svc.ingest_pdf(
            file_path=upload_path,
            filename=file.filename,
        )
    except Exception as exc:
        logger.exception("Ingestion failed for %s", file.filename)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document ingestion failed: {exc}",
        ) from exc

    return UploadResponse(
        document_id=result.document_id,
        filename=result.filename,
        pages=result.pages,
        chunks=result.chunks,
        message=f"✓ Successfully ingested {result.pages} pages into {result.chunks} chunks.",
    )


@router.post(
    "/run",
    response_model=AuditResponse,
    status_code=status.HTTP_200_OK,
    summary="Run a full compliance audit on an ingested document",
)
async def run_audit(
    request: AuditRunRequest,
    db: AsyncSession = Depends(get_db),
) -> AuditResponse:
    """
    Runs the full RAG → Gemini analysis → scoring pipeline.
    Persists results to database and returns the complete AuditResponse.
    """
    report_svc = ReportService(db)

    # Validate vendor
    vendor = await report_svc.get_vendor(str(request.vendor_id))
    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vendor {request.vendor_id} not found.",
        )

    # Create a PENDING report record
    audit_name = request.audit_name or f"{vendor.name} Compliance Audit"
    report = await report_svc.create_report_record(
        vendor_id=str(request.vendor_id),
        audit_name=audit_name,
        document_name=request.document_id,
        document_id=request.document_id,
    )

    try:
        # Mark as ANALYZING
        await report_svc.mark_report_status(report.id, AuditStatus.ANALYZING)

        # Run RAG pipeline
        rag_svc = RAGService()
        control_results, executive_summary = await rag_svc.run_audit(
            document_id=request.document_id,
            vendor_name=vendor.name,
        )

        # Mark as SCORING
        await report_svc.mark_report_status(report.id, AuditStatus.SCORING)

        # Run deterministic scoring
        scoring_result = compute_risk_score(control_results)

        # Finalize and persist
        # We need page/chunk count from the ingestion — approximate from findings
        audit_response = await report_svc.finalize_report(
            report_id=report.id,
            vendor=vendor,
            control_results=scoring_result.annotated_controls,
            score_breakdown=scoring_result.breakdown,
            executive_summary=executive_summary,
            document_pages=0,  # Set by upload step in production
            total_chunks=0,
        )

    except FileNotFoundError as exc:
        await report_svc.mark_report_status(report.id, AuditStatus.FAILED)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        await report_svc.mark_report_status(report.id, AuditStatus.FAILED)
        logger.exception("Audit failed for report_id=%s", report.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audit processing failed: {exc}",
        ) from exc

    return audit_response


@router.get(
    "/{report_id}",
    response_model=AuditResponse,
    summary="Retrieve a completed audit report",
)
async def get_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
) -> AuditResponse:
    report_svc = ReportService(db)
    report = await report_svc.get_report(report_id)

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report {report_id!r} not found.",
        )

    return report
