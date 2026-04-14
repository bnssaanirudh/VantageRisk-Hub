"""
AetherAudit — Automated Remediation Agent
============================================================
An agentic service that takes failed compliance findings and generates
a structured remediation strategy to help vendors fix their gaps.
"""
from __future__ import annotations
from typing import Any
from langchain_core.messages import HumanMessage, SystemMessage
from app.core.llm_client import get_llm
from app.models.schemas import ControlResult

REMEDIATION_SYSTEM_PROMPT = """
You are the AetherAudit Remediation Strategist.
Your goal is to take a set of FAILED or MISSING compliance controls and generate a high-level, professional remediation roadmap.

For each control provided, you must:
1. Explain the risk exposure (why this matters for the enterprise).
2. Provide 3 specific, technical action items to achieve a "PASSED" status.
3. Draft a professional, firm email snippet that the procurement team can send to the vendor.

TONE: Professional, authoritative, and solutions-oriented.
FORMAT: Structured Markdown with clear headings.
"""

class RemediationAgent:
    def __init__(self) -> None:
        self._llm = get_llm()

    async def generate_strategy(
        self, 
        vendor_name: str, 
        failed_controls: list[ControlResult]
    ) -> str:
        """Generates a detailed remediation PDF/Markdwon report."""
        if not failed_controls:
            return "All controls PASSED. No remediation required."

        findings_summary = "\n".join([
            f"- {c.control_name} ({c.status.value}): {c.summary}"
            for c in failed_controls
        ])

        human_prompt = f"""
## ACTION REQUIRED: Vendor Risk Remediation
VENDOR: {vendor_name}

The following compliance gaps were identified during the automated audit:
{findings_summary}

Please generate the remediation roadmap.
"""
        messages = [
            SystemMessage(content=REMEDIATION_SYSTEM_PROMPT),
            HumanMessage(content=human_prompt),
        ]
        
        response = await self._llm.ainvoke(messages)
        return str(response.content)


