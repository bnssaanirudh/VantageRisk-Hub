"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, File, X, Check, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auditApi } from "@/lib/api";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";

interface DocumentUploaderProps {
  vendorId: string;
  onSuccess: (documentId: string, filename: string) => void;
}

export function DocumentUploader({ vendorId, onSuccess }: DocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setError("Only PDF documents are supported.");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    // Simulate progress while uploading
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? prev : prev + 5));
    }, 200);

    try {
      const response = await auditApi.upload(vendorId, file);
      clearInterval(interval);
      setProgress(100);
      
      setTimeout(() => {
        onSuccess(response.document_id, file.name);
      }, 500);
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || "Upload failed. Please try again.");
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="border-2 border-dashed border-white/10 group-hover:border-blue-500/50 rounded-2xl p-8 transition-all bg-white/5 flex flex-col items-center justify-center text-center gap-4 py-12">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Upload Vendor Document</p>
                <p className="text-sm text-slate-500 mt-1">
                  JSON, SOC2, or Security Policy (PDF only)
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 border-blue-500/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <File className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB · PDF
                </p>
              </div>
              {!uploading && (
                <button
                  onClick={removeFile}
                  className="p-2 hover:bg-white/10 rounded-full text-slate-500 hover:text-red-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {uploading ? (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                    <span className="text-xs font-medium text-slate-300">
                      {progress < 100 ? "Analyzing with Gemini 1.5 Pro..." : "Ingestion Complete"}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-blue-400">{progress}%</span>
                </div>
                <Progress value={progress}>
                  <ProgressTrack className="h-1 bg-white/5">
                    <ProgressIndicator className="bg-gradient-to-r from-blue-500 to-purple-500" />
                  </ProgressTrack>
                </Progress>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400/80 uppercase tracking-wider font-semibold">
                    Encrypted Pipeline Active
                  </span>
                </motion.div>
              </div>
            ) : (
              <div className="mt-6 flex gap-3">
                <Button
                  onClick={handleUpload}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 border-none h-11"
                >
                  Confirm & Start Audit
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.div>
      )}
    </div>
  );
}
