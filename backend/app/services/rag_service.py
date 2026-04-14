"""
VendGuard — RAG Pipeline Service
Orchestrates: FAISS retrieval → Gemini prompt → JSON parsing → ControlResult list
"""
from __future__ import annotations

import json
import logging
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from app.core.llm_client import get_llm
from app.core.vector_store import get_vector_store
from app.models.enums import AuditLens, ControlStatus, RequiredControl, RiskLevel
from app.models.schemas import (
    ControlResult,
    LLMAuditOutput,
    LLMControlFinding,
    SourceCitation,
)


logger = logging.getLogger(__name__)

# Targeted queries for each lens
LENS_QUERIES: dict[AuditLens, dict[str, list[str]]] = {
    AuditLens.SECURITY: {
        "data_encryption": [
            "data encryption AES TLS at rest in transit key management",
            "encryption standards cryptographic controls data protection",
        ],
        "incident_response": [
            "incident response plan breach notification security incident",
            "CSIRT SIRT escalation procedures incident management timeline",
        ],
        "multi_factor_authentication": [
            "multi-factor authentication MFA 2FA two-factor TOTP access control",
            "authenticator second factor privileged access authentication",
        ],
        "data_deletion_policy": [
            "data retention deletion policy data purge secure erasure",
            "right to erasure data destruction off-boarding retention schedule",
        ],
    },
    AuditLens.FINANCIAL: {
        "revenue_recognition": [
            "revenue recognition IFRS 15 ASC 606 revenue booking policy",
            "performance obligations contract assets liabilities accounting",
        ],
        "budgetary_control": [
            "budgetary control variance analysis expenditure approval",
            "financial forecasting budget monitoring cost control",
        ],
        "ifrs_compliance": [
            "IFRS accounting standards financial reporting compliance",
            "balance sheet integrity financial statement audit",
        ],
        "internal_audit_logs": [
            "internal audit trails accounting logs immutable ledger",
            "financial review sequences audit documentation controls",
        ],
    },
    AuditLens.PRIVACY: {
        "data_sovereignty": [
            "data sovereignty residency cross-border transfer agreements",
            "standard contractual clauses SCC data localization requirements",
        ],
        "consent_management": [
            "consent management opt-in cookie policy withdrawal paths",
            "GDPR consent requirements user preferences tracking",
        ],
        "right_to_erasure": [
            "right to erasure forgotten procedures automated deletion",
            "personal data purge requests privacy rights execution",
        ],
        "third_party_sharing": [
            "third party sharing DPA data processing agreement",
            "sub-processor disclosure list third party risk management",
        ],
    },
    AuditLens.HEALTHCARE: {
        "hipaa_compliance": [
            "HIPAA compliance BAA business associate agreement PHI safeguards",
            "healthcare privacy regulations medical data security audit",
        ],
        "clinical_data_privacy": [
            "clinical data anonymization patient consent research privacy",
            "EHR data de-identification healthcare privacy protocols",
        ],
        "medical_device_security": [
            "medical device security FDA cybersecurity software as medical device",
            "IoMT security vitals encryption legacy firmware updates",
        ],
        "ehr_interoperability": [
            "EHR interoperability FHIR standards secure data exchange",
            "patient data portability health information exchange security",
        ],
    },
    AuditLens.AGRICULTURE: {
        "supply_chain_traceability": [
            "supply chain traceability farm to table provenance tracking",
            "IoT agriculture field security provenance batch tracking",
        ],
        "fair_trade_audit": [
            "fair trade compliance labor law farmers pricing policy",
            "agricultural labor standards child labor prohibition audit",
        ],
        "sustainability_reporting": [
            "agricultural sustainability carbon sequestration water usage",
            "biodiversity impact sustainable farming reporting metrics",
        ],
        "pesticide_logs_integrity": [
            "pesticide usage logs chemical transparency benchmark",
            "organic certification validity agricultural chemical controls",
        ],
    }
}

class RAGService:
    """
    End-to-end RAG pipeline for compliance auditing.
    Supports Security, Financial, and Privacy lenses.
    """

    def __init__(self) -> None:
        self._vector_store = get_vector_store()
        self._llm = get_llm()

    async def run_audit(
        self,
        document_id: str,
        vendor_name: str,
        lens: AuditLens = AuditLens.SECURITY,
    ) -> tuple[list[ControlResult], str]:
        """
        Run the full compliance audit for a document.

        Returns:
            (control_results, executive_summary)
        """
        # Step 1: Retrieve relevant chunks for all controls
        logger.info("Starting RAG audit: lens=%s vendor=%s", lens.value, vendor_name)
        retrieved_chunks = await self._retrieve_all_controls(document_id, lens)

        # Step 2: Build the human prompt with evidence
        human_prompt = self._build_human_prompt(vendor_name, retrieved_chunks, lens)

        # Step 3: Call Gemini
        logger.info("Calling Gemini 1.5 Pro for %s analysis...", lens.value)
        llm_output = await self._call_llm(human_prompt, lens)

        # Step 4: Parse and validate
        audit_output = self._parse_llm_response(llm_output, lens)

        # Step 5: Hydrate with citations from chunk metadata
        control_results = self._hydrate_control_results(audit_output, retrieved_chunks, lens)

        return control_results, audit_output.executive_summary

    # ── Private Methods ────────────────────────────────────────────────────────

    async def _retrieve_all_controls(
        self,
        document_id: str,
        lens: AuditLens,
    ) -> dict[str, list[tuple[str, dict, float]]]:
        """
        Retrieve chunks for the specific lens.
        """
        from app.config import get_settings
        k = get_settings().retrieval_k
        all_chunks: dict[str, list[tuple[str, dict, float]]] = {}
        
        queries_for_lens = LENS_QUERIES.get(lens, {})

        for control_id, queries in queries_for_lens.items():
            seen_chunk_ids: set[str] = set()
            control_chunks: list[tuple[str, dict, float]] = []

            for query in queries:
                results = await self._vector_store.similarity_search(
                    document_id=document_id,
                    query=query,
                    k=k // len(queries),
                )
                for text, metadata, score in results:
                    chunk_id = metadata.get("chunk_id", "")
                    if chunk_id not in seen_chunk_ids and score > 0.3:
                        seen_chunk_ids.add(chunk_id)
                        control_chunks.append((text, metadata, score))

            control_chunks.sort(key=lambda x: x[2], reverse=True)
            all_chunks[control_id] = control_chunks[:k]

        return all_chunks

    def _build_human_prompt(
        self,
        vendor_name: str,
        retrieved_chunks: dict[str, list[tuple[str, dict, float]]],
        lens: AuditLens,
    ) -> str:
        """Construct the evidence-packed prompt for Gemini."""
        from app.prompts.auditor_system import LENS_CONTROLS
        
        lines: list[str] = [
            f"## VENDOR UNDER AUDIT: {vendor_name}",
            f"## AUDIT LENS: {lens.value}",
            "",
            "## RETRIEVED EVIDENCE FROM VENDOR DOCUMENT",
            "",
        ]

        controls = LENS_CONTROLS.get(lens, [])
        for control_meta in controls:
            control_id = control_meta["id"]
            chunks = retrieved_chunks.get(control_id, [])
            lines.append(f"### Control: {control_meta['name']} (ID: {control_id})")

            if not chunks:
                lines.append("⚠️  NO RELEVANT CHUNKS FOUND — this control must be marked MISSING.")
            else:
                for i, (text, metadata, score) in enumerate(chunks, 1):
                    page = metadata.get("page_number", "?")
                    lines.append(f"\n[Evidence {i} | Page {page} | Relevance: {score:.2f}]")
                    lines.append(text.strip())
            lines.append("")

        lines.append("## TASK")
        lines.append(f"Assess all {len(controls)} controls for the {lens.value} LENS based on the evidence above.")
        return "\n".join(lines)

    async def _call_llm(self, human_prompt: str, lens: AuditLens) -> str:
        """Invoke Gemini with lens-specific prompt."""
        from app.prompts.auditor_system import get_auditor_prompt
        messages = [
            SystemMessage(content=get_auditor_prompt(lens)),
            HumanMessage(content=human_prompt),
        ]
        response = await self._llm.ainvoke(messages)
        content = response.content
        if isinstance(content, list):
            # Extract text from all text blocks
            full_text = []
            for block in content:
                if isinstance(block, dict) and block.get("type") == "text":
                    full_text.append(block.get("text", ""))
                elif isinstance(block, str):
                    full_text.append(block)
            return "".join(full_text)
        return str(content)

    def _parse_llm_response(self, raw_response: str, lens: AuditLens) -> LLMAuditOutput:
        """
        Parse and validate the LLM JSON response for a specific lens.
        """
        from app.prompts.auditor_system import LENS_CONTROLS
        try:
            clean = raw_response.strip()
            # Remove markdown code blocks if present
            if "```" in clean:
                # Extract content between the first and last ```
                parts = clean.split("```")
                for part in parts:
                    if part.strip().startswith("{") or part.strip().startswith("["):
                        clean = part.strip()
                        if clean.startswith("json"):
                            clean = clean[4:].strip()
                        break
            
            # Remove any trailing/leading text outside the first { and last }
            start = clean.find("{")
            end = clean.rfind("}")
            if start != -1 and end != -1:
                clean = clean[start : end + 1]

            data: dict[str, Any] = json.loads(clean)
        except json.JSONDecodeError as exc:
            logger.error("LLM returned non-JSON response: %s | Raw response: %s", exc, raw_response)
            data = {"controls": [], "executive_summary": "Parsing error. All controls marked MISSING."}


        # Ensure all lens-specific controls are present
        controls_metadata = LENS_CONTROLS.get(lens, [])
        found_ids = {c.get("control_id") for c in data.get("controls", [])}
        
        for meta in controls_metadata:
            if meta["id"] not in found_ids:
                logger.warning("LLM omitted control %s — adding as MISSING", meta["id"])
                data["controls"].append({
                    "control_id": meta["id"],
                    "status": "MISSING",
                    "risk_level": "HIGH",
                    "summary": f"{meta['name']} was not found in the provided document chunks.",
                    "evidence": None,
                    "page_references": [],
                    "recommendations": [f"Establish a formal {meta['name']} framework."],
                })

        return LLMAuditOutput(
            controls=[LLMControlFinding(**c) for c in data["controls"]],
            executive_summary=data.get("executive_summary", "Executive summary unavailable."),
        )

    def _hydrate_control_results(
        self,
        audit_output: LLMAuditOutput,
        retrieved_chunks: dict[str, list[tuple[str, dict, float]]],
        lens: AuditLens,
    ) -> list[ControlResult]:
        """
        Convert LLM findings into ControlResult objects with lens-aware display names.
        """
        from app.prompts.auditor_system import LENS_CONTROLS
        results: list[ControlResult] = []
        controls_meta = {m["id"]: m for m in LENS_CONTROLS.get(lens, [])}

        for finding in audit_output.controls:
            citations: list[SourceCitation] = []
            control_chunks = retrieved_chunks.get(finding.control_id, [])

            for text, metadata, score in control_chunks:
                if score > 0.5:
                    citations.append(
                        SourceCitation(
                            page_number=metadata.get("page_number", 0),
                            paragraph_index=metadata.get("paragraph_index", 0),
                            excerpt=text[:400].strip(),
                            confidence_score=round(score, 4),
                            chunk_id=metadata.get("chunk_id", ""),
                        )
                    )

            citations.sort(key=lambda c: (c.page_number, c.paragraph_index))
            meta = controls_meta.get(finding.control_id, {"name": finding.control_id})

            results.append(
                ControlResult(
                    control_id=RequiredControl(finding.control_id),
                    control_name=meta["name"],
                    status=ControlStatus(finding.status),
                    risk_level=RiskLevel(finding.risk_level),
                    summary=finding.summary,
                    evidence=finding.evidence,
                    citations=citations,
                    recommendations=finding.recommendations,
                    penalty_applied=0,
                )
            )

        return results
