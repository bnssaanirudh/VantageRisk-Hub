"""
VendGuard — SQLAlchemy Async ORM Models
Uses SQLAlchemy 2.0 mapped_column syntax for full type safety.
SQLite for local dev; PostgreSQL for production (same schema, different driver).
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    JSON,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


def _uuid() -> str:
    return str(uuid.uuid4())


class Vendor(Base):
    __tablename__ = "vendors"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    industry: Mapped[Optional[str]] = mapped_column(String(100))
    website: Mapped[Optional[str]] = mapped_column(String(500))
    contact_email: Mapped[Optional[str]] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    audit_reports: Mapped[list[AuditReport]] = relationship(
        "AuditReport", back_populates="vendor", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Vendor id={self.id} name={self.name!r}>"


class AuditReport(Base):
    __tablename__ = "audit_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    vendor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True
    )
    audit_name: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", index=True)
    audit_lens: Mapped[str] = mapped_column(String(20), default="SECURITY", index=True)

    # Document metadata
    document_name: Mapped[str] = mapped_column(String(300), nullable=False)
    document_id: Mapped[str] = mapped_column(String(100), nullable=False)
    document_pages: Mapped[int] = mapped_column(Integer, default=0)
    total_chunks: Mapped[int] = mapped_column(Integer, default=0)

    # Score
    final_score: Mapped[Optional[float]] = mapped_column(Float)
    grade: Mapped[Optional[str]] = mapped_column(String(2))
    score_breakdown: Mapped[Optional[dict]] = mapped_column(JSON)

    # AI output
    executive_summary: Mapped[Optional[str]] = mapped_column(Text)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Relationships
    vendor: Mapped[Vendor] = relationship("Vendor", back_populates="audit_reports")
    control_findings: Mapped[list[ControlFinding]] = relationship(
        "ControlFinding", back_populates="audit_report", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<AuditReport id={self.id} score={self.final_score} grade={self.grade}>"


class ControlFinding(Base):
    __tablename__ = "control_findings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    report_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("audit_reports.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Control identification
    control_id: Mapped[str] = mapped_column(String(100), nullable=False)
    control_name: Mapped[str] = mapped_column(String(200), nullable=False)

    # Assessment
    status: Mapped[str] = mapped_column(String(20), nullable=False)  # ControlStatus enum value
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    evidence: Mapped[Optional[str]] = mapped_column(Text)
    penalty_applied: Mapped[int] = mapped_column(Integer, default=0)

    # JSON arrays for complex fields
    recommendations: Mapped[list] = mapped_column(JSON, default=list)
    citations: Mapped[list] = mapped_column(JSON, default=list)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    audit_report: Mapped[AuditReport] = relationship(
        "AuditReport", back_populates="control_findings"
    )

    def __repr__(self) -> str:
        return f"<ControlFinding control={self.control_id} status={self.status}>"
