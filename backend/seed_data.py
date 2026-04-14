import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.db_models import Base, Vendor, AuditReport, ControlFinding
from app.models.enums import AuditStatus, AuditLens, RiskGrade, ControlStatus, RiskLevel
from datetime import datetime, timezone
import uuid

DATABASE_URL = "sqlite+aiosqlite:///./vendguard.db"

async def seed():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        async with engine.begin() as conn:
            # Create tables
            await conn.run_sync(Base.metadata.create_all)

        # 1. Create Sample Vendors
        vendors = [
            Vendor(
                name="CloudScale Technologies",
                industry="Cloud Infrastructure",
                website="https://cloudscale.demo",
                contact_email="security@cloudscale.demo"
            ),
            Vendor(
                name="BioHealth Solutions",
                industry="Healthcare",
                website="https://biohealth.demo",
                contact_email="privacy@biohealth.demo"
            ),
            Vendor(
                name="EcoFarm Global",
                industry="Agriculture",
                website="https://ecofarm.demo",
                contact_email="ops@ecofarm.demo"
            )
        ]
        
        for v in vendors:
            session.add(v)
        await session.flush()

        # 2. Add an Audit Report for CloudScale
        report = AuditReport(
            vendor_id=vendors[0].id,
            audit_name="Annual Security Review 2026",
            status=AuditStatus.COMPLETED.value,
            audit_lens=AuditLens.SECURITY.value,
            document_name="SOC2_Compliance_2026.pdf",
            document_id="doc_hash_12345",
            document_pages=42,
            total_chunks=156,
            final_score=92.5,
            grade=RiskGrade.A.value,
            executive_summary="CloudScale demonstrates robust security controls with state-of-the-art encryption and incident response protocols. Minor documentation gaps in MFA rollout were identified but remediated during the audit.",
            completed_at=datetime.now(timezone.utc),
            score_breakdown={
                "passed_controls": 4,
                "total_required_controls": 4,
                "base_score": 100.0,
                "total_penalties": 0,
                "entity_risk_multiplier": 0.925,
                "sentiment_adjustment": 0,
                "final_score": 92.5,
                "grade": "A",
                "formula_repr": "(4/4)x100 - 0 = 100 -> GAT Adj -> 92.5"
            }
        )
        session.add(report)
        await session.flush()

        # 3. Add Control Findings
        findings = [
            ControlFinding(
                report_id=report.id,
                control_id="data_encryption",
                control_name="Data Encryption",
                status=ControlStatus.PASSED.value,
                risk_level=RiskLevel.NONE.value,
                summary="AES-256 encryption at rest and TLS 1.3 in transit are universally applied.",
                evidence="All persistent data volumes are encrypted using AWS KMS with AES-256-GCM.",
                penalty_applied=0,
                recommendations=[],
                citations=[{"page_number": 12, "text": "All data at rest is encrypted using AES-256."}]
            ),
            ControlFinding(
                report_id=report.id,
                control_id="multi_factor_authentication",
                control_name="MFA",
                status=ControlStatus.PASSED.value,
                risk_level=RiskLevel.NONE.value,
                summary="MFA is enforced for all administrative and user accounts.",
                evidence="Company policy section 4.1 requires TOTP or Hardware keys for all SSO logins.",
                penalty_applied=0,
                recommendations=[],
                citations=[{"page_number": 5, "text": "MFA is mandatory for all employees."}]
            )
        ]
        for f in findings:
            session.add(f)

        await session.commit()
        print("✅ Database successfully seeded with sample data!")

if __name__ == "__main__":
    asyncio.run(seed())
