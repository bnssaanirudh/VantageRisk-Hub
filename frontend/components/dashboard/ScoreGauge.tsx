"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, animate } from "framer-motion";
import type { RiskGrade } from "@/types/audit";

interface ScoreGaugeProps {
  score: number;
  grade: RiskGrade;
  size?: number;
}

const gradeConfig: Record<RiskGrade, { color: string; label: string; track: string }> = {
  A: { color: "#22C55E", label: "Excellent", track: "rgba(34,197,94,0.2)" },
  B: { color: "#84CC16", label: "Good", track: "rgba(132,204,22,0.2)" },
  C: { color: "#F59E0B", label: "Fair", track: "rgba(245,158,11,0.2)" },
  D: { color: "#F97316", label: "Poor", track: "rgba(249,115,22,0.2)" },
  F: { color: "#EF4444", label: "Critical", track: "rgba(239,68,68,0.2)" },
};

export function ScoreGauge({ score, grade, size = 220 }: ScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const config = gradeConfig[grade];

  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  // Arc covers 270 degrees (from 135deg to 45deg going clockwise)
  const arcLength = circumference * 0.75;
  const offset = arcLength - (score / 100) * arcLength;

  // Animate the score counter
  useEffect(() => {
    const controls = animate(0, score, {
      duration: 1.8,
      ease: "easeOut",
      onUpdate: (v) => setDisplayScore(Math.round(v)),
    });
    return controls.stop;
  }, [score]);

  // Animate the stroke offset
  const strokeOffset = useMotionValue(arcLength);
  const springOffset = useSpring(strokeOffset, { stiffness: 80, damping: 20 });

  useEffect(() => {
    strokeOffset.set(offset);
  }, [offset, strokeOffset]);

  const cx = size / 2;
  const cy = size / 2;

  // Gauge starts at 135° and ends at 45° (270° sweep)
  const startAngle = 135;
  const endAngle = 45;

  function polarToCartesian(angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  const arcPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 1 1 ${end.x} ${end.y}`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="absolute inset-0">
          {/* Track arc */}
          <path
            d={arcPath}
            fill="none"
            stroke={config.track}
            strokeWidth={12}
            strokeLinecap="round"
          />
          {/* Animated score arc */}
          <motion.path
            d={arcPath}
            fill="none"
            stroke={config.color}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={springOffset}
            style={{
              filter: `drop-shadow(0 0 8px ${config.color}80)`,
            }}
            initial={{ strokeDashoffset: arcLength }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className="text-5xl font-extrabold tabular-nums"
            style={{ color: config.color }}
          >
            {displayScore}
          </motion.div>
          <div className="text-slate-500 text-sm mt-1">/ 100</div>
          <div
            className="text-xs font-bold mt-2 px-3 py-1 rounded-full"
            style={{
              color: config.color,
              backgroundColor: config.track,
            }}
          >
            Grade {grade} · {config.label}
          </div>
        </div>

        {/* Pulse ring when score is low */}
        {score < 50 && (
          <div className="absolute inset-2 rounded-full">
            <div
              className="absolute inset-0 rounded-full ping-slow"
              style={{ backgroundColor: `${config.color}10` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
