"""
VendGuard — Domain Enumerations
Centralised enum definitions to ensure type-safety across all layers.
"""
from __future__ import annotations

import enum


class ControlStatus(str, enum.Enum):
    """Result of a single compliance control check."""
    PASSED = "PASSED"
    FAILED = "FAILED"
    MISSING = "MISSING"          # Evidence not found in document — treated as HIGH RISK


class RiskLevel(str, enum.Enum):
    """Severity classification for a control gap."""
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    NONE = "NONE"               # Used when control is PASSED


class AuditStatus(str, enum.Enum):
    """Lifecycle state of an audit job."""
    PENDING = "PENDING"
    INGESTING = "INGESTING"
    ANALYZING = "ANALYZING"
    SCORING = "SCORING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class AuditLens(str, enum.Enum):
    """The specific compliance domain being audited."""
    SECURITY = "SECURITY"
    FINANCIAL = "FINANCIAL"
    PRIVACY = "PRIVACY"
    HEALTHCARE = "HEALTHCARE"
    AGRICULTURE = "AGRICULTURE"


class RiskGrade(str, enum.Enum):
    """Letter grade derived from the numeric risk score."""
    A = "A"    # >= 90
    B = "B"    # >= 75
    C = "C"    # >= 60
    D = "D"    # >= 45
    F = "F"    # < 45


# ── Control IDs (canonical names for controls across all lenses) ─────────────
class RequiredControl(str, enum.Enum):
    # Security Lens
    DATA_ENCRYPTION = "data_encryption"
    INCIDENT_RESPONSE = "incident_response"
    MFA = "multi_factor_authentication"
    DATA_DELETION = "data_deletion_policy"
    
    # Financial Lens
    REVENUE_RECOGNITION = "revenue_recognition"
    BUDGETARY_CONTROL = "budgetary_control"
    IFRS_COMPLIANCE = "ifrs_compliance"
    INTERNAL_AUDIT_LOGS = "internal_audit_logs"
    
    # Privacy Lens
    DATA_SOVEREIGNTY = "data_sovereignty"
    CONSENT_MANAGEMENT = "consent_management"
    RIGHT_TO_ERASURE = "right_to_erasure"
    THIRD_PARTY_SHARING = "third_party_sharing"

    # Healthcare Lens (NEW)
    HIPAA_COMPLIANCE = "hipaa_compliance"
    CLINICAL_DATA_PRIVACY = "clinical_data_privacy"
    MEDICAL_DEVICE_SECURITY = "medical_device_security"
    EHR_INTEROPERABILITY = "ehr_interoperability"

    # Agriculture Lens (NEW)
    SUPPLY_CHAIN_TRACEABILITY = "supply_chain_traceability"
    FAIR_TRADE_AUDIT = "fair_trade_audit"
    SUSTAINABILITY_REPORTING = "sustainability_reporting"
    PESTICIDE_LOGS_INTEGRITY = "pesticide_logs_integrity"
