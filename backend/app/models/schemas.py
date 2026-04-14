"""
VendGuard — Pydantic v2 Request/Response Schemas
These schemas define the API contract. All JSON validation flows through here.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

from app.models.enums import (
    AuditStatus,
    ControlStatus,
    RequiredControl,
    RiskGrade,
    RiskLevel,
)


# ── Shared Base ───────────────────────────────────────────────────────────────

class VendGuardBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


# ── Source Attribution ────────────────────────────────────────────────────────

class SourceCitation(VendGuardBase):
    """Exact provenance from the ingested PDF."""
    page_number: int = Field(..., description="1-indexed page in the source PDF")
    paragraph_index: int = Field(..., description="0-indexed paragraph on the page")
    excerpt: str = Field(..., max_length=500, description="Verbatim text snippet (≤500 chars)")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Embedding similarity score")
    chunk_id: str = Field(..., description="FAISS chunk identifier for traceability")


# ── Control Findings ──────────────────────────────────────────────────────────

class ControlResult(VendGuardBase):
    """Assessment result for a single compliance control."""
    control_id: RequiredControl
    control_name: str
    status: ControlStatus
    risk_level: RiskLevel
    summary: str = Field(..., description="AI-generated one-sentence assessment")
    evidence: Optional[str] = Field(
        None,
        description="Direct quote or paraphrase from the document. NULL if MISSING."
    )
    citations: list[SourceCitation] = Field(default_factory=list)
    recommendations: list[str] = Field(
        default_factory=list,
        description="Actionable remediation steps"
    )
    penalty_applied: int = Field(default=0, description="Score penalty for this control gap")


# ── Score Breakdown ───────────────────────────────────────────────────────────

class ScoreBreakdown(VendGuardBase):
    """Full arithmetic breakdown of the risk score formula."""
    passed_controls: int
    total_required_controls: int
    base_score: float = Field(..., description="(passed/total) × 100 before penalties")
    total_penalties: int = Field(..., description="Sum of all critical vulnerability penalties")
    entity_risk_multiplier: float = Field(default=1.0, description="GAT-inspired relationship risk factor")
    sentiment_adjustment: float = Field(default=0.0, description="Predictive sentiment score adjustment")
    final_score: float = Field(..., ge=0.0, le=100.0, description="Clamped to [0, 100]")
    grade: RiskGrade
    formula_repr: str = Field(
        ...,
        description="Human-readable formula: e.g. '(3/4)×100 − 25 = 50'"
    )


# ── Vendor Schemas ────────────────────────────────────────────────────────────

class VendorCreate(VendGuardBase):
    name: str = Field(..., min_length=1, max_length=200)
    industry: Optional[str] = None
    website: Optional[str] = None
    contact_email: Optional[str] = None


class VendorRead(VendGuardBase):
    id: UUID
    name: str
    industry: Optional[str]
    website: Optional[str]
    contact_email: Optional[str]
    created_at: datetime
    latest_score: Optional[float] = None
    latest_grade: Optional[RiskGrade] = None
    audit_count: int = 0


class VendorList(VendGuardBase):
    vendors: list[VendorRead]
    total: int


# ── Audit Schemas ─────────────────────────────────────────────────────────────

class AuditRunRequest(VendGuardBase):
    vendor_id: UUID
    document_id: str = Field(..., description="Returned from /audit/upload")
    audit_name: Optional[str] = None
    audit_lens: AuditLens = Field(default=AuditLens.SECURITY)


class AuditResponse(VendGuardBase):
    """Complete audit result — the core payload of IncomeLens AI."""
    report_id: UUID
    vendor_id: UUID
    vendor_name: str
    audit_name: str
    audit_lens: AuditLens
    status: AuditStatus
    document_name: str
    document_pages: int
    total_chunks: int
    control_results: list[ControlResult]
    score_breakdown: ScoreBreakdown
    executive_summary: str = Field(..., description="AI-generated 3-sentence executive summary")
    created_at: datetime
    completed_at: Optional[datetime] = None


class AuditStatusResponse(VendGuardBase):
    """Polling response for in-progress audits."""
    report_id: UUID
    status: AuditStatus
    progress_message: str
    progress_percent: int = Field(..., ge=0, le=100)


class UploadResponse(VendGuardBase):
    document_id: str
    filename: str
    pages: int
    chunks: int
    message: str


# ── LLM Internal Schema (structured output from Gemini) ──────────────────────

class LLMControlFinding(BaseModel):
    """Internal schema enforced on Gemini's JSON output."""
    control_id: str
    status: str              # "PASSED" | "FAILED" | "MISSING"
    risk_level: str          # "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE"
    summary: str
    evidence: Optional[str]
    page_references: list[int]
    recommendations: list[str]


class LLMAuditOutput(BaseModel):
    """Top-level structured output from the AI Auditor."""
    controls: list[LLMControlFinding]
    executive_summary: str
