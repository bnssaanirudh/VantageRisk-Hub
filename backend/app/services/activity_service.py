"""
IncomeLens AI — Activity Intelligence Stream
============================================================
Tracks and simulates the 'Intelligence Trail' of the agentic workflow.
Useful for demonstrating real-time audit logs and enterprise visibility.
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any
from pydantic import BaseModel, Field

class ActivityEvent(BaseModel):
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    event_type: str  # i.e. 'REDIREVAL', 'SCORE_UPDATE', 'GAT_ADJUST'
    message: str
    metadata: dict[str, Any] = Field(default_factory=dict)

class ActivityService:
    @staticmethod
    def log_event(event_type: str, message: str, **kwargs) -> ActivityEvent:
        event = ActivityEvent(
            event_type=event_type,
            message=message,
            metadata=kwargs
        )
        # In a real app, this would persist to Redis/DB and broadcast via WebSockets
        return event

    @staticmethod
    def get_mock_audit_trail(vendor_name: str) -> list[ActivityEvent]:
        """Provides a high-fidelity mock trail for demo purposes."""
        return [
            ActivityEvent(event_type="INGEST", message=f"Ingested 142MB PDF for {vendor_name}."),
            ActivityEvent(event_type="LENS_ACTIVATE", message="Security Lens activated. Configuring 2M context window."),
            ActivityEvent(event_type="RAG_SEARCH", message="Retrieving 42 evidence chunks via Targeted Vector Search."),
            ActivityEvent(event_type="GAT_ANALYSIS", message="Relationship graph analyzed. Entity multiplier adjusted to 1.12x."),
            ActivityEvent(event_type="REMEDIATION", message="Remediation Agent drafting fix strategies for 'MFA' gap."),
            ActivityEvent(event_type="FINALIZE", message=f"Audit complete for {vendor_name}. Final Grade: B+."),
        ]
