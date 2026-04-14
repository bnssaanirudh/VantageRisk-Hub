"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  History, 
  AlertTriangle,
  FileText,
  Calendar,
  Building2,
  Loader2
} from "lucide-react";
import { vendorsApi, auditApi } from "@/lib/api";
import type { VendorRead, AuditResponse, RequiredControl, AuditLens } from "@/types/audit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScoreGauge } from "@/components/dashboard/ScoreGauge";
import { ComplianceGapList } from "@/components/dashboard/ComplianceGapList";
import { SourceAttribution } from "@/components/dashboard/SourceAttribution";
import { DocumentUploader } from "@/components/upload/DocumentUploader";
import { WhatIfAnalysis } from "@/components/dashboard/WhatIfAnalysis";


export default function VendorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<VendorRead | null>(null);
  const [report, setReport] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeControlId, setActiveControlId] = useState<RequiredControl | null>(null);
  const [auditLens, setAuditLens] = useState<AuditLens>("SECURITY");


  useEffect(() => {
    loadVendor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  const loadVendor = async () => {
    try {
      const data = await vendorsApi.get(vendorId);
      setVendor(data);
      // If vendor has an audit history, we could fetch the latest report here
    } catch (err) {
      console.error("Failed to load vendor", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = async (documentId: string) => {
    setAnalyzing(true);
    try {
      const result = await auditApi.run({
        vendor_id: vendorId,
        document_id: documentId,
        audit_name: `${vendor?.name} ${auditLens} Audit`,
        audit_lens: auditLens
      });

      setReport(result);
      if (result.control_results.length > 0) {
        setActiveControlId(result.control_results[0].control_id);
      }
    } catch (err) {
      console.error("Audit failed", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const activeCitations = useMemo(() => {
    if (!report || !activeControlId) return [];
    const control = report.control_results.find(c => c.control_id === activeControlId);
    return control?.citations || [];
  }, [report, activeControlId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-[#080B14] p-8 text-center">
        <p className="text-white">Vendor not found.</p>
        <Button onClick={() => router.push("/dashboard")} className="mt-4">Back to Dashboard</Button>
      </div>
    );
  }

  const handleExportPDF = () => {
    window.print();
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert("✓ Report link copied to clipboard!");
    });
  };

  return (
    <div className="min-h-screen bg-[#080B14] bg-mesh p-6 md:p-8 print:bg-white print:p-0">
      {/* Header */}
      <nav className="flex items-center justify-between mb-8 print:hidden">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push("/dashboard")}
            className="rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">{vendor.name}</h1>
              <Badge variant="outline" className="text-[10px] border-white/10 text-slate-500 bg-white/5">
                PRO PROFILE
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{vendor.industry || "General Industry"} · {vendor.website || "No website"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleShare}
            className="text-slate-500 hover:text-white hover:bg-white/5"
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button 
            onClick={handleExportPDF}
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {analyzing ? (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-spin" />
              <ShieldCheck className="w-10 h-10 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h2 className="text-2xl font-bold text-white mt-8">Agentic Auditor Active</h2>
            <p className="text-slate-500 max-w-sm mt-2 leading-relaxed text-sm">
              Gemini 1.5 Pro is analyzing entire document context to verify security controls with zero-hallucination policy.
            </p>
            <div className="mt-8 flex gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Retrieving Context
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                Evaluating Controls
              </div>
            </div>
          </motion.div>
        ) : report ? (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-12 gap-6"
          >
            {/* Left Column — Score & Summary */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <Card className="glass p-8 border-white/5 text-center flex flex-col items-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Security Merit Score</p>
                <ScoreGauge score={report.score_breakdown.final_score} grade={report.score_breakdown.grade} />
                <div className="mt-8 w-full">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-500 font-medium">Compliance Baseline</span>
                    <span className="text-white font-mono">{report.score_breakdown.passed_controls}/{report.score_breakdown.total_required_controls}</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500" 
                      style={{ width: `${(report.score_breakdown.passed_controls / report.score_breakdown.total_required_controls) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 italic text-xs text-slate-400 w-full text-center">
                  &quot; {report.score_breakdown.formula_repr} &quot;
                </div>
              </Card>

              <Card className="glass p-6 border-white/5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded bg-blue-500/10 text-blue-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-300">Executive Summary</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed italic">
                  {report.executive_summary}
                </p>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Audit Date</span>
                    </div>
                    <span className="text-[11px] text-slate-300">{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Source Doc</span>
                    </div>
                    <span className="text-[11px] text-slate-300 truncate max-w-[120px]">{report.document_name}</span>
                  </div>
                </div>
              </Card>

              <Card className="glass p-6 border-white/5 bg-amber-500/[0.02] print-hidden">
                <WhatIfAnalysis report={report} />
              </Card>
            </div>


            {/* Middle Column — Controls List */}
            <div className="col-span-12 lg:col-span-5">
              <Card className="glass p-6 border-white/5 h-full">
                <ComplianceGapList 
                  controls={report.control_results} 
                  onSelectControl={(id) => setActiveControlId(id)}
                  activeControlId={activeControlId}
                />
              </Card>
            </div>

            {/* Right Column — Source Attribution & History */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
              <Card className="glass p-6 border-white/5 bg-white/[0.02]">
                <SourceAttribution citations={activeCitations} activeControl={activeControlId || ""} />
              </Card>

              <Card className="glass p-6 border-white/5 space-y-6 print-hidden">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <History className="w-3 h-3" />
                    Audit History
                  </h4>
                  <div className="space-y-2">
                    {vendor.audit_history && vendor.audit_history.length > 0 ? (
                      vendor.audit_history.map((h) => (
                        <button
                          key={h.report_id}
                          onClick={async () => {
                            setLoading(true);
                            try {
                              const fullReport = await auditApi.get(h.report_id);
                              setReport(fullReport);
                            } catch (e) {
                              console.error(e);
                            } finally {
                              setLoading(false);
                            }
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-left ${
                            report?.report_id === h.report_id ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-[11px] text-slate-300 font-medium truncate">{h.audit_name}</p>
                            <p className="text-[10px] text-slate-500">{new Date(h.created_at).toLocaleDateString()}</p>
                          </div>
                          <Badge className={`text-[9px] ${
                            h.grade === 'A' ? 'bg-green-500/20 text-green-400' :
                            h.grade === 'F' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'
                          }`}>
                            {h.grade || '-'}
                          </Badge>
                        </button>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-600 italic">No previous audits found.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Building2 className="w-3 h-3" />
                    Vendor Metadata
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                      <p className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Industry</p>
                      <p className="text-[11px] text-slate-300">{vendor.industry || "General Technology"}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                      <p className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Contact</p>
                      <p className="text-[11px] text-slate-300 font-mono">{vendor.contact_email || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>

        ) : (
          <motion.div
            key="uploader"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto py-12"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white leading-tight">Begin Risk Assessment</h2>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                VendGuard&apos;s RAG pipeline requires the latest security policy or SOC 2 document to perform a deterministic audit.
              </p>
            </div>

            <div className="mb-8 grid grid-cols-3 gap-2 p-1 bg-white/5 border border-white/5 rounded-2xl">
              {(["SECURITY", "FINANCIAL", "PRIVACY"] as AuditLens[]).map((lens) => (
                <button
                  key={lens}
                  onClick={() => setAuditLens(lens)}
                  className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${
                    auditLens === lens 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {lens}
                </button>
              ))}
            </div>

            <DocumentUploader vendorId={vendorId} onSuccess={handleUploadSuccess} />

            <div className="mt-12 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <History className="w-5 h-5 text-slate-600 mb-3" />
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-1">Audit History</h4>
                <div className="space-y-2 mt-2">
                  {vendor.audit_history && vendor.audit_history.length > 0 ? (
                    vendor.audit_history.slice(0, 3).map((h) => (
                      <button
                        key={h.report_id}
                        onClick={async () => {
                          setLoading(true);
                          try {
                            const fullReport = await auditApi.get(h.report_id);
                            setReport(fullReport);
                          } catch (e) {
                            console.error(e);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="w-full flex items-center justify-between text-[10px] hover:bg-white/5 p-1 rounded transition-colors group"
                      >
                        <span className="text-slate-400 truncate max-w-[120px] group-hover:text-blue-400">{h.audit_name}</span>
                        <span className="text-slate-500">{new Date(h.created_at).toLocaleDateString()}</span>
                      </button>
                    ))
                  ) : (
                    <p className="text-[10px] text-slate-600 leading-normal">No previous audits found for this vendor.</p>
                  )}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <Building2 className="w-5 h-5 text-slate-600 mb-3" />
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-1">Vendor Metadata</h4>
                <div className="mt-2 space-y-1">
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Industry: <span className="text-slate-300">{vendor.industry || "General"}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Contact: <span className="text-slate-300 font-mono text-[9px]">{vendor.contact_email || "N/A"}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Since: <span className="text-slate-300">{new Date(vendor.created_at).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

        )}
      </AnimatePresence>
    </div>
  );
}

function ShieldCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
