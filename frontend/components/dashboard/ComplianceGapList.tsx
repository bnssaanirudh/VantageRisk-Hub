"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown, AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import type { ControlResult, ControlStatus, RiskLevel, RequiredControl } from "@/types/audit";

interface ComplianceGapListProps {
  controls: ControlResult[];
  onSelectControl: (id: RequiredControl) => void;
  activeControlId: RequiredControl | null;
}

const statusConfig: Record<ControlStatus, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  PASSED: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    label: "Passed",
  },
  FAILED: {
    icon: AlertCircle,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    label: "Failed",
  },
  MISSING: {
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    label: "Missing",
  },
};

const riskBadge: Record<RiskLevel, string> = {
  CRITICAL: "bg-red-500/20 text-red-400 border-red-500/30",
  HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  MEDIUM: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  LOW: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  NONE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

function ControlCard({ 
  control, 
  index, 
  isActive, 
  onClick 
}: { 
  control: ControlResult; 
  index: number; 
  isActive: boolean;
  onClick: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[control.status];
  const StatusIcon = cfg.icon;

  const handleInteraction = () => {
    setExpanded(!expanded);
    onClick();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`rounded-xl border transition-all ${
        isActive ? 'border-blue-500/50 shadow-lg shadow-blue-500/10' : 'border-white/5'
      } ${cfg.bg} overflow-hidden`}
    >
      <button
        onClick={handleInteraction}
        className={`w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors ${
          isActive ? 'bg-white/10' : ''
        }`}
      >
        <StatusIcon className={`w-5 h-5 shrink-0 ${cfg.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-white">{control.control_name}</span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full border ${riskBadge[control.risk_level]}`}
            >
              {control.risk_level}
            </span>
            {control.penalty_applied > 0 && (
              <span className="text-xs text-red-400 font-mono">−{control.penalty_applied}pts</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{control.summary}</p>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
              {/* Evidence */}
              {control.evidence && (
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Evidence Found
                  </p>
                  <p className="text-sm text-slate-300 italic leading-relaxed">
                    "{control.evidence}"
                  </p>
                </div>
              )}
              {control.status === "MISSING" && (
                <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">
                    ⚠️ Not Found in Document
                  </p>
                  <p className="text-sm text-slate-400">
                    No explicit evidence of this control was found. Marked as HIGH RISK per
                    VendGuard's Zero-Hallucination policy.
                  </p>
                </div>
              )}

              {/* Recommendations */}
              {control.recommendations.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Remediation Steps
                  </p>
                  <ul className="space-y-1.5">
                    {control.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Citation count */}
              {control.citations.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Info className="w-3.5 h-3.5" />
                  {control.citations.length} source reference{control.citations.length !== 1 ? "s" : ""} found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function ComplianceGapList({ 
  controls, 
  onSelectControl, 
  activeControlId 
}: ComplianceGapListProps) {
  // Sort: MISSING first, then FAILED, then PASSED
  const sorted = [...controls].sort((a, b) => {
    const order = { MISSING: 0, FAILED: 1, PASSED: 2 };
    return order[a.status] - order[b.status];
  });

  const gaps = controls.filter((c) => c.status !== "PASSED").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300">Compliance Controls</h3>
        {gaps > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
            {gaps} gap{gaps !== 1 ? "s" : ""} found
          </span>
        )}
      </div>
      <div className="space-y-2">
        {sorted.map((control, i) => (
          <ControlCard 
            key={control.control_id} 
            control={control} 
            index={i} 
            isActive={control.control_id === activeControlId}
            onClick={() => onSelectControl(control.control_id)}
          />
        ))}
      </div>
    </div>
  );
}
