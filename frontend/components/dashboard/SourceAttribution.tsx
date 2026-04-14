"use client";

import { motion } from "framer-motion";
import { FileText, ExternalLink, Quote, Search } from "lucide-react";
import type { SourceCitation } from "@/types/audit";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SourceAttributionProps {
  citations: SourceCitation[];
  activeControl: string;
}

export function SourceAttribution({ citations, activeControl }: SourceAttributionProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-300">Source Attribution</h3>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-slate-500 border-white/5">
          {citations.length} Citations
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {citations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center opacity-50">
            <FileText className="w-8 h-8 mb-2 text-slate-600" />
            <p className="text-xs text-slate-500">No citations found for this control.</p>
          </div>
        ) : (
          citations.map((citation, i) => (
            <motion.div
              key={citation.chunk_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass p-3 rounded-lg border-white/5 hover:border-blue-500/30 transition-colors group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 rounded bg-blue-500/10 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                    PAGE {citation.page_number}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {Math.round(citation.confidence_score * 100)}% Match
                  </div>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-blue-400">
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              
              <div className="relative">
                <Quote className="absolute -left-1 -top-1 w-3 h-3 text-blue-500/20" />
                <p className="text-xs text-slate-400 leading-relaxed pl-3 italic">
                  {citation.excerpt}...
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <Info className="w-3 h-3" />
          <span>Showing exact paragraphs cited by Gemini 1.5 Pro</span>
        </div>
      </div>
    </div>
  );
}

function Info(props: any) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
