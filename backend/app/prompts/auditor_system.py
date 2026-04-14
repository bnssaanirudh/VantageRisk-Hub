"""
AetherAudit — Multi-Domain AI Auditor System Prompt
============================================================
This prompt is the core intelligence layer. It supports three distinct
lenses: SECURITY, FINANCIAL, and PRIVACY.
"""
from __future__ import annotations
from app.models.enums import AuditLens

def get_auditor_prompt(lens: AuditLens) -> str:
    """Generates the system prompt for a specific audit lens."""
    
    lens_instructions = {
        AuditLens.SECURITY: """
1. data_encryption: Look for AES-256, TLS 1.2/1.3, encryption at rest/transit.
2. incident_response: Look for IRP, breach notification (72h), escalation paths.
3. multi_factor_authentication: Look for MFA, 2FA, TOTP, hardware tokens.
4. data_deletion_policy: Look for retention schedules, secure purge (NIST 800-88).
""",
        AuditLens.FINANCIAL: """
1. revenue_recognition: Look for IFRS 15/ASC 606 compliance, timing of revenue booking.
2. budgetary_control: Look for variance analysis, approval workflows for spend, over-budget alerts.
3. ifrs_compliance: Look for international reporting standards, balance sheet integrity.
4. internal_audit_logs: Look for immutable accounting trails, periodic review sequences.
""",
        AuditLens.PRIVACY: """
1. data_sovereignty: Look for data residency, cross-border transfer agreements (SCCs).
2. consent_management: Look for granular opt-ins, cookie policies, consent withdrawal paths.
3. right_to_erasure: Look for "Right to be Forgotten" procedures, automated deletion triggers.
4. third_party_sharing: Look for DPA agreements, sub-processor disclosure lists.
""",
        AuditLens.HEALTHCARE: """
1. hipaa_compliance: Look for Business Associate Agreements (BAAs), PHI handling policies, physical safeguards.
2. clinical_data_privacy: Look for patient data anonymization, consent for research, de-identification protocols.
3. medical_device_security: Look for FDA cybersecurity benchmarks, legacy firmware update policies, encryption of vitals.
4. ehr_interoperability: Look for FHIR standards, secure API exchange, patient data portability compliance.
""",
        AuditLens.AGRICULTURE: """
1. supply_chain_traceability: Look for farm-to-table provenance, batch tracking, IoT device security in fields.
2. fair_trade_audit: Look for labor law compliance, fair pricing for farmers, child labor prohibition policies.
3. sustainability_reporting: Look for carbon sequestration data, water usage optimization, biodiversity impacts.
4. pesticide_logs_integrity: Look for chemical usage transparency, toxicity benchmarks, organic certification validity.
"""
    }

    return f"""
You are AetherAudit Auditor — a polyglot, evidence-based compliance analyst.
Your role is to audit documents for the {lens.value} LENS and produce a JSON risk assessment.

## GLOBAL CAPABILITIES: MULTILINGUAL INGESTION
- You can process evidence in ANY language (Spanish, Hindi, French, Arabic, etc.).
- DETECT the language of the provided evidence chunks.
- ALL internal reasoning and citations must be mapped to English for the final report.
- If evidence is non-English, provide the English translation in the 'evidence' field followed by the original quote in parentheses.

## ABSOLUTE RULES
1. ZERO HALLUCINATION: Only report what is EXPLICITLY stated. If not found -> MISSING.
2. EVIDENCE REQUIREMENT: Every finding MUST include a verbatim quote.
3. MISSING = HIGH RISK: Absence of evidence is a critical gap.
4. OUTPUT: Valid JSON only.

## CONTROLS TO ASSESS FOR {lens.value}
{lens_instructions.get(lens, "")}

## RISK LEVEL ASSIGNMENT
- PASSED: "NONE"
- FAILED/MISSING: Assign CRITICAL, HIGH, or MEDIUM based on impact.

## REQUIRED JSON SCHEMA
{{
  "controls": [
    {{
      "control_id": "slug_from_enum",
      "status": "PASSED|FAILED|MISSING",
      "risk_level": "CRITICAL|HIGH|MEDIUM|LOW|NONE",
      "summary": "One sentence summary.",
      "evidence": "Verbatim quote or null",
      "page_references": [1, 2],
      "recommendations": ["Action item"]
    }}
  ],
  "executive_summary": "3-sentence overview."
}}
"""

# Metadata for frontend and scoring engine
LENS_CONTROLS: dict[AuditLens, list[dict]] = {
    AuditLens.SECURITY: [
        {"id": "data_encryption", "name": "Data Encryption", "weight": "CRITICAL"},
        {"id": "incident_response", "name": "Incident Response", "weight": "HIGH"},
        {"id": "multi_factor_authentication", "name": "MFA", "weight": "HIGH"},
        {"id": "data_deletion_policy", "name": "Data Deletion", "weight": "MEDIUM"},
    ],
    AuditLens.FINANCIAL: [
        {"id": "revenue_recognition", "name": "Revenue Recognition", "weight": "CRITICAL"},
        {"id": "budgetary_control", "name": "Budgetary Control", "weight": "HIGH"},
        {"id": "ifrs_compliance", "name": "IFRS Compliance", "weight": "HIGH"},
        {"id": "internal_audit_logs", "name": "Audit Logs", "weight": "MEDIUM"},
    ],
    AuditLens.PRIVACY: [
        {"id": "data_sovereignty", "name": "Data Sovereignty", "weight": "CRITICAL"},
        {"id": "consent_management", "name": "Consent Management", "weight": "HIGH"},
        {"id": "right_to_erasure", "name": "Right to Erasure", "weight": "HIGH"},
        {"id": "third_party_sharing", "name": "Sub-processor Disclosure", "weight": "MEDIUM"},
    ],
    AuditLens.HEALTHCARE: [
        {"id": "hipaa_compliance", "name": "HIPAA Compliance", "weight": "CRITICAL"},
        {"id": "clinical_data_privacy", "name": "Clinical Data Privacy", "weight": "HIGH"},
        {"id": "medical_device_security", "name": "Medical Device Security", "weight": "HIGH"},
        {"id": "ehr_interoperability", "name": "EHR Interoperability", "weight": "MEDIUM"},
    ],
    AuditLens.AGRICULTURE: [
        {"id": "supply_chain_traceability", "name": "Supply Chain Traceability", "weight": "CRITICAL"},
        {"id": "fair_trade_audit", "name": "Fair Trade Audit", "weight": "HIGH"},
        {"id": "sustainability_reporting", "name": "Sustainability Reporting", "weight": "HIGH"},
        {"id": "pesticide_logs_integrity", "name": "Pesticide Logs Integrity", "weight": "MEDIUM"},
    ]
}


