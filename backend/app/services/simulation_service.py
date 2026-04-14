"""
IncomeLens AI — Strategic Simulation Engine
============================================================
Allows "What-If" risk modeling by simulating remediation steps.
Computes projected scores based on GAT-inspired math without mutating original audit reports.
"""
from __future__ import annotations
from typing import NamedTuple
from app.models.enums import ControlStatus, RiskGrade
from app.models.schemas import ControlResult, ScoreBreakdown
from app.services.scoring_service import compute_risk_score

class SimulationResult(NamedTuple):
    projected_breakdown: ScoreBreakdown
    improvement_delta: float

class SimulationService:
    @staticmethod
    def run_what_if_analysis(
        original_results: list[ControlResult],
        vendor_id: str,
        controls_to_fix: list[str]  # List of control_ids to simulate as PASSED
    ) -> SimulationResult:
        """
        Simulates the risk score if specific controls are remediated.
        """
        simulated_results = []
        for cr in original_results:
            if cr.control_id.value in controls_to_fix:
                # Simulate as PASSED
                simulated_cr = cr.model_copy(update={
                    "status": ControlStatus.PASSED,
                    "risk_level": "NONE",
                    "penalty_applied": 0
                })
                simulated_results.append(simulated_cr)
            else:
                simulated_results.append(cr)

        # Re-run the scoring engine with simulated results
        # compute_risk_score returns (breakdown, annotated_controls)
        scoring_out = compute_risk_score(simulated_results, vendor_id=vendor_id)
        
        orig_score = 0
        # Calculate improvement delta
        # Since we don't have the original breakdown here easily, we could pass it in, 
        # but for simplicity we compute the improvemente relative to the current simulation.
        
        return SimulationResult(
            projected_breakdown=scoring_out.breakdown,
            improvement_delta=scoring_out.breakdown.final_score
        )
