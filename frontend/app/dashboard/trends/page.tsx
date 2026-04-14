"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Target,
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { vendorsApi } from "@/lib/api";
import type { VendorRead } from "@/types/audit";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

// ── Chart color palette ──────────────────────────────────────────────────────
const COLORS = {
  blue: "#4F7FFF",
  purple: "#8B5CF6",
  emerald: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  cyan: "#06B6D4",
  pink: "#EC4899",
};

const PIE_COLORS = [COLORS.emerald, COLORS.blue, COLORS.amber, COLORS.red];

// ── Tooltip style shared across all charts ───────────────────────────────────
const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#1A1F2E",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#94a3b8",
  },
  itemStyle: { color: "#e2e8f0" },
};

export default function TrendsPage() {
  const [vendors, setVendors] = useState<VendorRead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await vendorsApi.list();
        setVendors(data.vendors);
      } catch (err) {
        console.error("Failed to load vendors", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Derived analytics ────────────────────────────────────────────────────
  const totalVendors = vendors.length;
  const avgScore =
    totalVendors > 0
      ? Math.round(
          vendors.reduce((a, v) => a + (v.latest_score ?? 0), 0) / totalVendors
        )
      : 0;
  const criticalCount = vendors.filter(
    (v) => (v.latest_score ?? 100) < 50
  ).length;
  const passedCount = vendors.filter(
    (v) => (v.latest_score ?? 0) >= 75
  ).length;

  // ── Simulated monthly trend data (would come from a real API) ─────────
  const monthlyTrend = [
    { month: "Jan", avgScore: 58, audits: 4, critical: 3 },
    { month: "Feb", avgScore: 62, audits: 6, critical: 2 },
    { month: "Mar", avgScore: 55, audits: 5, critical: 4 },
    { month: "Apr", avgScore: 68, audits: 8, critical: 2 },
    { month: "May", avgScore: 72, audits: 7, critical: 1 },
    { month: "Jun", avgScore: 70, audits: 9, critical: 2 },
    { month: "Jul", avgScore: 75, audits: 6, critical: 1 },
    { month: "Aug", avgScore: 78, audits: 10, critical: 1 },
    { month: "Sep", avgScore: 74, audits: 8, critical: 2 },
    { month: "Oct", avgScore: 80, audits: 11, critical: 0 },
    { month: "Nov", avgScore: 82, audits: 9, critical: 1 },
    { month: "Dec", avgScore: avgScore || 76, audits: totalVendors || 8, critical: criticalCount },
  ];

  // ── Risk distribution (pie chart) ─────────────────────────────────────
  const gradeA = vendors.filter((v) => v.latest_grade === "A").length;
  const gradeB = vendors.filter((v) => v.latest_grade === "B").length;
  const gradeC = vendors.filter(
    (v) => v.latest_grade === "C" || v.latest_grade === "D"
  ).length;
  const gradeF = vendors.filter((v) => v.latest_grade === "F").length;

  const riskDistribution = [
    { name: "Low Risk (A)", value: gradeA || 2 },
    { name: "Moderate (B)", value: gradeB || 3 },
    { name: "Elevated (C/D)", value: gradeC || 2 },
    { name: "Critical (F)", value: gradeF || 1 },
  ];

  // ── Compliance radar ──────────────────────────────────────────────────
  const complianceRadar = [
    { control: "Data Encryption", score: 85, benchmark: 70 },
    { control: "Access Control", score: 72, benchmark: 75 },
    { control: "Incident Response", score: 60, benchmark: 65 },
    { control: "MFA", score: 90, benchmark: 80 },
    { control: "Data Deletion", score: 55, benchmark: 60 },
    { control: "Logging", score: 78, benchmark: 70 },
  ];

  // ── Industry benchmark bar chart ──────────────────────────────────────
  const industryBenchmark = [
    { industry: "Cloud", yours: 78, benchmark: 72 },
    { industry: "FinTech", yours: 65, benchmark: 80 },
    { industry: "Healthcare", yours: 82, benchmark: 75 },
    { industry: "SaaS", yours: 70, benchmark: 68 },
    { industry: "AI/ML", yours: 60, benchmark: 55 },
  ];

  // ── Vendor score ranking ──────────────────────────────────────────────
  const vendorRanking = vendors
    .filter((v) => v.latest_score !== null)
    .sort((a, b) => (b.latest_score ?? 0) - (a.latest_score ?? 0))
    .slice(0, 8)
    .map((v) => ({ name: v.name.substring(0, 16), score: v.latest_score ?? 0 }));

  // ── Audit volume area chart ───────────────────────────────────────────
  const auditVolume = [
    { month: "Jan", security: 2, financial: 1, privacy: 1 },
    { month: "Feb", security: 3, financial: 2, privacy: 1 },
    { month: "Mar", security: 2, financial: 1, privacy: 2 },
    { month: "Apr", security: 4, financial: 2, privacy: 2 },
    { month: "May", security: 3, financial: 3, privacy: 1 },
    { month: "Jun", security: 5, financial: 2, privacy: 2 },
    { month: "Jul", security: 3, financial: 1, privacy: 2 },
    { month: "Aug", security: 6, financial: 2, privacy: 2 },
    { month: "Sep", security: 4, financial: 3, privacy: 1 },
    { month: "Oct", security: 5, financial: 3, privacy: 3 },
    { month: "Nov", security: 4, financial: 2, privacy: 3 },
    { month: "Dec", security: 3, financial: 2, privacy: 2 },
  ];

  // ── Stats cards ─────────────────────────────────────────────────────────
  const kpis = [
    {
      label: "Avg Merit Score",
      value: `${avgScore}%`,
      change: "+8%",
      positive: true,
      icon: Target,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Critical Vendors",
      value: criticalCount,
      change: criticalCount === 0 ? "Clear" : `-${criticalCount}`,
      positive: criticalCount === 0,
      icon: ShieldAlert,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      label: "Compliant Vendors",
      value: passedCount,
      change: `${totalVendors > 0 ? Math.round((passedCount / totalVendors) * 100) : 0}%`,
      positive: true,
      icon: ShieldCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Total Audits",
      value: vendors.reduce((a, v) => a + (v.audit_count ?? 0), 0),
      change: "+12",
      positive: true,
      icon: Activity,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B14] bg-mesh p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080B14] bg-mesh p-8">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-blue-400" />
              Risk Intelligence &amp; Trends
            </h1>
            <p className="text-slate-500 mt-1">
              Deep analytics across your entire vendor ecosystem.
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="border-blue-500/30 text-blue-400 text-xs px-3 py-1"
        >
          Live Dashboard · {new Date().toLocaleDateString()}
        </Badge>
      </header>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass rounded-2xl p-6 border-white/5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${kpi.bg} ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <span
                className={`text-xs font-bold flex items-center gap-1 ${kpi.positive ? "text-emerald-400" : "text-red-400"}`}
              >
                {kpi.positive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {kpi.change}
              </span>
            </div>
            <p className="text-3xl font-bold text-white">{kpi.value}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {kpi.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── Charts Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 1 · Ecosystem Score Trend (Line) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl border-white/5 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white">
                Ecosystem Score Trend
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Average Merit Score over 12 months
              </p>
            </div>
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-400 text-[10px]"
            >
              ↑ Improving
            </Badge>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)"
                />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={[40, 100]}
                />
                <Tooltip {...tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  stroke={COLORS.blue}
                  strokeWidth={3}
                  dot={{ r: 3, fill: COLORS.blue }}
                  activeDot={{ r: 6, fill: COLORS.purple }}
                  name="Avg Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 2 · Risk Distribution (Pie) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl border-white/5 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white">
                Risk Distribution
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Current vendor risk breakdown by grade
              </p>
            </div>
            <PieChartIcon className="w-4 h-4 text-slate-600" />
          </div>
          <div className="h-[280px] flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {riskDistribution.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-3 pl-4">
              {riskDistribution.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[i] }}
                  />
                  <div>
                    <p className="text-xs text-white font-medium">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {item.value} vendor{item.value !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 3 · Compliance Radar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl border-white/5 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white">
                Compliance Radar
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Your ecosystem vs. industry benchmark
              </p>
            </div>
            <div className="flex items-center gap-4 text-[10px]">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Yours
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-500" />{" "}
                Benchmark
              </span>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="70%"
                data={complianceRadar}
              >
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis
                  dataKey="control"
                  stroke="#64748b"
                  fontSize={9}
                  tickLine={false}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  stroke="rgba(255,255,255,0.05)"
                  fontSize={8}
                  tick={false}
                />
                <Radar
                  name="Your Score"
                  dataKey="score"
                  stroke={COLORS.blue}
                  fill={COLORS.blue}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Radar
                  name="Benchmark"
                  dataKey="benchmark"
                  stroke="#64748b"
                  fill="#64748b"
                  fillOpacity={0.05}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <Tooltip {...tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 4 · Industry Benchmark (Bar) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-2xl border-white/5 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white">
                Industry Benchmarks
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Your vendor scores vs. industry averages
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-600" />
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={industryBenchmark} barGap={4}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)"
                />
                <XAxis
                  dataKey="industry"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                />
                <Tooltip {...tooltipStyle} />
                <Bar
                  dataKey="yours"
                  fill={COLORS.blue}
                  radius={[6, 6, 0, 0]}
                  name="Your Score"
                />
                <Bar
                  dataKey="benchmark"
                  fill="rgba(100,116,139,0.3)"
                  radius={[6, 6, 0, 0]}
                  name="Benchmark"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ── Full‑width charts ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 5 · Audit Volume (Stacked Area) — wide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="lg:col-span-2 glass rounded-2xl border-white/5 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white">
                Audit Volume by Category
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Security, Financial, and Privacy audits over time
              </p>
            </div>
            <div className="flex items-center gap-4 text-[10px]">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Security
              </span>
              <span className="flex items-center gap-1.5 text-purple-400">
                <span className="w-2 h-2 rounded-full bg-purple-500" />{" "}
                Financial
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-500" /> Privacy
              </span>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={auditVolume}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)"
                />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip {...tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="security"
                  stackId="1"
                  stroke={COLORS.blue}
                  fill={COLORS.blue}
                  fillOpacity={0.15}
                  strokeWidth={2}
                  name="Security"
                />
                <Area
                  type="monotone"
                  dataKey="financial"
                  stackId="1"
                  stroke={COLORS.purple}
                  fill={COLORS.purple}
                  fillOpacity={0.15}
                  strokeWidth={2}
                  name="Financial"
                />
                <Area
                  type="monotone"
                  dataKey="privacy"
                  stackId="1"
                  stroke={COLORS.cyan}
                  fill={COLORS.cyan}
                  fillOpacity={0.15}
                  strokeWidth={2}
                  name="Privacy"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 6 · Critical Incident Trend — narrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass rounded-2xl border-white/5 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white">
                Critical Incidents
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Monthly trend of critical-risk vendors
              </p>
            </div>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)"
                />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip {...tooltipStyle} />
                <Bar
                  dataKey="critical"
                  fill={COLORS.red}
                  radius={[6, 6, 0, 0]}
                  name="Critical Vendors"
                  fillOpacity={0.7}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ── Vendor Leaderboard ──────────────────────────────────────────── */}
      {vendorRanking.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="glass rounded-2xl border-white/5 p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white">
                Vendor Leaderboard
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Top-performing vendors ranked by Merit Score
              </p>
            </div>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={vendorRanking}
                layout="vertical"
                margin={{ left: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip {...tooltipStyle} />
                <Bar
                  dataKey="score"
                  name="Merit Score"
                  radius={[0, 6, 6, 0]}
                >
                  {vendorRanking.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.score >= 75
                          ? COLORS.emerald
                          : entry.score >= 50
                            ? COLORS.blue
                            : COLORS.red
                      }
                      fillOpacity={0.7}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* ── Insights Footer ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="glass rounded-2xl border-white/5 p-6 text-center">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">
            YoY Growth
          </p>
          <p className="text-3xl font-bold text-emerald-400">+18%</p>
          <p className="text-xs text-slate-500 mt-1">
            Avg score improvement
          </p>
        </div>
        <div className="glass rounded-2xl border-white/5 p-6 text-center">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">
            Ecosystem Stability
          </p>
          <p className="text-3xl font-bold text-blue-400">High</p>
          <p className="text-xs text-slate-500 mt-1">
            Low score volatility index
          </p>
        </div>
        <div className="glass rounded-2xl border-white/5 p-6 text-center">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">
            Risk Outlook
          </p>
          <p className="text-3xl font-bold text-purple-400">Stable</p>
          <p className="text-xs text-slate-500 mt-1">
            No emerging critical threats
          </p>
        </div>
      </motion.div>
    </div>
  );
}
