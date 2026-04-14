"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Plus, Calculator, Zap } from "lucide-react";
import type { ControlResult, AuditResponse, RiskGrade } from "@/types/audit";
import { Badge } from "@/components/ui/badge";

interface WhatIfAnalysisProps {
  report: AuditResponse;
}

export function WhatIfAnalysis({ report }: WhatIfAnalysisProps) {
  const [fixedControlIds, setFixedControlIds] = useState<Set<string>>(new Set());

  const failedControls = useMemo(() => {
    return report.control_results.filter(c => c.status !== "PASSED");
  }, [report]);

  const toggleFix = (id: string) => {
    const next = new Set(fixedControlIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFixedControlIds(next);
  };

  const projectedScore = useMemo(() => {
    let score = report.score_breakdown.final_score;
    
    // We reverse the penalty logic from scoring_service.py approximately
    // Actually, let's just use the penalty_applied from the controls
    failedControls.forEach(c => {
      if (fixedControlIds.has(c.control_id)) {
        // Approximate recovery: base_score + (penalty * multiplier)
        // Since we don't have the exact formula live here, we simulate the improvement
        const penalty = c.penalty_applied || 0;
        const multiplier = report.score_breakdown.entity_risk_multiplier;
        score += penalty * multiplier;
      }
    });

    return Math.min(100, Math.round(score * 10) / 10);
  }, [report, failedControls, fixedControlIds]);

  const projectedGrade = useMemo((): RiskGrade => {
    const s = projectedScore;
    if (s >= 90) return "A";
    if (s >= 75) return "B";
    if (s >= 60) return "C";
    if (s >= 45) return "D";
    return "F";
  }, [projectedScore]);

  if (failedControls.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-tight">What-If Analysis Engine</h3>
        </div>
        <Badge variant="outline" className="border-amber-500/20 text-amber-500 bg-amber-500/10">Simulation</Badge>
      </div>

      <div className="space-y-3">
        <p className="text-[11px] text-slate-500 font-medium">
          Simulate remediation impact by selecting gaps to resolve below.
        </p>
        
        <div className="space-y-2">
          {failedControls.map((c) => (
            <button
              key={c.control_id}
              onClick={() => toggleFix(c.control_id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                fixedControlIds.has(c.control_id) 
                  ? 'bg-emerald-500/10 border-emerald-500/30' 
                  : 'bg-white/5 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  fixedControlIds.has(c.control_id) ? 'bg-emerald-500' : 'bg-red-500'
                }`} />
                <span className="text-xs font-semibold text-white">{c.control_name}</span>
              </div>
              {fixedControlIds.has(c.control_id) ? (
                <span className="text-[10px] font-bold text-emerald-400">+{(c.penalty_applied * report.score_breakdown.entity_risk_multiplier).toFixed(1)}pts</span>
              ) : (
                <span className="text-[10px] font-bold text-slate-600">−{c.penalty_applied}pts</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Projected Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{projectedScore}</span>
              <span className="text-sm font-bold text-slate-500">/ 100</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Impact Grade</p>
            <span className={`text-2xl font-black grade-${projectedGrade}`}>{projectedGrade}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
            <span>Score Boost</span>
            <span className="text-emerald-400">+{Math.round((projectedScore - report.score_breakdown.final_score) * 10) / 10} points</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: `${report.score_breakdown.final_score}%` }}
              animate={{ width: `${projectedScore}%` }}
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
