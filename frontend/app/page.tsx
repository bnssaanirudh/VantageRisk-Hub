"use client";

import { motion } from "framer-motion";
import { Shield, Zap, BarChart3, FileSearch, ArrowRight, BrainCircuit, Globe, Activity } from "lucide-react";
import Link from "next/link";
import { BRAND_CONFIG } from "@/lib/brand";

const features = [
  {
    icon: BrainCircuit,
    title: "Intelligence-Driven Auditing",
    description:
      "Beyond basic RAG. Our agentic workflow analyzes entity relationships and predictive risk patterns.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: BarChart3,
    title: "Multi-Domain 'Lenses'",
    description:
      "Switch between Security, Finance, and Privacy audit modes with a single click.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Globe,
    title: "Global Compliance Benchmarks",
    description:
      "Automatically maps vendor findings to SOC2, ISO 27001, GDPR, HIPAA, and IFRS standards.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Zap,
    title: "Automated Remediation",
    description:
      "AI-generated strategies to fix compliance gaps instantly. Turn failures into action items.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
];

const liveAudits = [
  { name: "CloudScale Inc.", status: "PASSED", score: 98, type: "Security" },
  { name: "HealthGenics India", status: "PASSED", score: 92, type: "Health" },
  { name: "AgriCore Brazil", status: "FAILED", score: 42, type: "Agri" },
  { name: "FinFlow Services", status: "FAILED", score: 55, type: "Finance" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#080B14] text-white selection:bg-blue-500/30 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight leading-none uppercase">{BRAND_CONFIG.name}</span>
            <span className="text-[10px] text-blue-400 font-medium tracking-[0.2em] mt-1">HACKATHON EDITION</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">Methodology</Link>
          <Link href="/auth" className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white">
            Sign In
          </Link>
          <Link
            href="/auth"
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 transition-all shadow-lg shadow-blue-500/20"
          >
            Launch Platform
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-32 pb-24 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 uppercase tracking-widest mb-8">
            <Activity className="w-3 h-3 animate-pulse" />
            2M Token Context · Gemini 1.5 Pro
          </div>

          <h1 className="text-7xl font-extrabold tracking-tighter leading-[1.05] mb-8">
            The Lens for{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              Enterprise Risk
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-xl mb-12 leading-relaxed font-medium">
            Automate SOC2, Finance, and Privacy audits with zero-hallucination agentic intelligence. 
            Turn compliance friction into a competitive advantage.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/auth"
              className="group w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-white text-black font-bold text-lg hover:bg-blue-50 transition-all hover:-translate-y-1 shadow-2xl shadow-white/10"
            >
              Start Auditing
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition-colors text-center"
            >
              Explore Lenses
            </Link>
          </div>
        </motion.div>

        {/* Live Audit Feed UI Mock */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-blue-500/20 rounded-[2.5rem] blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative glass border-white/10 rounded-[2.5rem] p-8 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-semibold uppercase tracking-tighter text-slate-400">Deep Scan Active</span>
              </div>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>

            <div className="space-y-4">
              {liveAudits.map((audit, i) => (
                <motion.div
                  key={audit.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.2 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all"
                >
                  <div className="flex gap-4 items-center">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      audit.status === 'PASSED' ? 'bg-emerald-500/10 text-emerald-400' : 
                      audit.status === 'FAILED' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      <FileSearch className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{audit.name}</h4>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500">{audit.type} LENS</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold ${
                      audit.status === 'PASSED' ? 'text-emerald-400' : 
                      audit.status === 'FAILED' ? 'text-red-400' : 'text-amber-400'
                    }`}>{audit.score}/100</span>
                    <div className="w-16 h-1 bg-white/5 rounded-full mt-1">
                      <div className={`h-full rounded-full ${
                        audit.status === 'PASSED' ? 'bg-emerald-500' : 
                        audit.status === 'FAILED' ? 'bg-red-500' : 'bg-amber-500'
                      }`} style={{ width: `${audit.score}%` }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-slate-500">Processing SOC2 Report...</span>
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-[#0A0D17] bg-gradient-to-br from-slate-700 to-slate-900" />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Advanced Tech Showcase Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-24 border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-16">
          <div className="max-w-2xl">
            <h2 className="text-5xl font-extrabold tracking-tighter mb-6">Strategic Intelligence</h2>
            <p className="text-blue-100/60 text-lg leading-relaxed">
              Experience the inner monologue of our agentic workflow. VantageRisk Hub doesn&apos;t just produce a score; 
              it provides a <span className="text-emerald-400">traceable chain of reasoning</span> from global polyglot ingestion to final risk mitigation.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="px-5 py-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold tracking-tight">
              MULTI_LENS_ACTIVE
            </div>
            <div className="px-5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold tracking-tight">
              POLYGLOT_INGESTION_READY
            </div>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-[3rem] p-12 backdrop-blur-md overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          
          <div className="grid lg:grid-cols-2 gap-16 relative z-10">
            <div className="space-y-6">
              {[
                { time: "14:21:02", msg: "Polyglot Agent: Detected Spanish Excerpt (Page 14). Translating...", icon: Globe },
                { time: "14:21:05", msg: "GAT Engine: Relationship Risk adjusted for 'HealthGenics' nodes.", icon: BrainCircuit },
                { time: "14:21:08", msg: "Remediation Agent: Generating technical fix roadmap for HIPAA gap.", icon: Shield },
                { time: "14:21:12", msg: "Strategic Foresight: Simulation Mode active. Projected score +22pts.", icon: BarChart3 }
              ].map((log, i) => (
                <div key={i} className="flex gap-5 p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all group/item">
                  <div className="p-3 rounded-2xl bg-white/5 text-blue-400 group-hover/item:text-blue-300">
                    <log.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-blue-400/50 mb-1">{log.time} · SYSTEM_AGENT</div>
                    <p className="text-sm font-semibold text-blue-100/80 group-hover/item:text-white transition-colors">{log.msg}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-12 flex flex-col justify-center text-center">
              <div className="space-y-6">
                <div className="inline-flex p-4 rounded-3xl bg-blue-500/10 mb-2">
                  <Activity className="w-10 h-10 text-blue-400 animate-pulse" />
                </div>
                <h3 className="text-3xl font-bold">What-If Analysis Engine</h3>
                <p className="text-blue-100/40 text-sm px-4 leading-relaxed">
                  Toggle remediation steps in real-time to visualize your compliance journey. 
                  Identify the highest impact fixes before spending a single dollar.
                </p>
                <div className="pt-8">
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: "45%" }}
                      animate={{ width: "85%" }}
                      transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
                    />
                  </div>
                  <div className="flex justify-between mt-4 text-xs font-bold font-mono">
                    <span className="text-blue-400">BASLINE SCORE: 45</span>
                    <span className="text-emerald-400">PROJECTED: 85</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-8 py-24 border-t border-white/5">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="glass p-8 rounded-[2rem] border-white/5 hover:border-white/20 transition-all hover:-translate-y-2 group"
            >
              <div className={`w-12 h-12 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 ring-1 ring-white/10 group-hover:ring-white/30 transition-all`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 pt-16 pb-8 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-500" />
            <span className="text-lg font-bold tracking-tight">{BRAND_CONFIG.name}</span>
          </div>
          <div className="text-slate-500 text-sm">
            © 2026 Built for <span className="text-white font-medium">Orion Build Challenge</span> & <span className="text-white font-medium">Tech Builder Hackathon</span>
          </div>
          <div className="flex gap-6 text-sm font-medium text-slate-500">
            <Link href="#" className="hover:text-white transition-colors">Documentation</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Github</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

