// VendGuard — TypeScript Interfaces (mirrors backend Pydantic schemas)

export type ControlStatus = "PASSED" | "FAILED" | "MISSING";
export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE";
export type AuditStatus =
  | "PENDING"
  | "INGESTING"
  | "ANALYZING"
  | "SCORING"
  | "COMPLETED"
  | "FAILED";
export type RiskGrade = "A" | "B" | "C" | "D" | "F";
export type RequiredControl =
  | "data_encryption"
  | "incident_response"
  | "multi_factor_authentication"
  | "data_deletion_policy";

export interface SourceCitation {
  page_number: number;
  paragraph_index: number;
  excerpt: string;
  confidence_score: number;
  chunk_id: string;
}

export interface ControlResult {
  control_id: RequiredControl;
  control_name: string;
  status: ControlStatus;
  risk_level: RiskLevel;
  summary: string;
  evidence: string | null;
  citations: SourceCitation[];
  recommendations: string[];
  penalty_applied: number;
}

export interface ScoreBreakdown {
  passed_controls: number;
  total_required_controls: number;
  base_score: number;
  total_penalties: number;
  final_score: number;
  grade: RiskGrade;
  formula_repr: string;
}

export interface AuditResponse {
  report_id: string;
  vendor_id: string;
  vendor_name: string;
  audit_name: string;
  status: AuditStatus;
  document_name: string;
  document_pages: number;
  total_chunks: number;
  control_results: ControlResult[];
  score_breakdown: ScoreBreakdown;
  executive_summary: string;
  created_at: string;
  completed_at: string | null;
}

export interface VendorRead {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  contact_email: string | null;
  created_at: string;
  latest_score: number | null;
  latest_grade: RiskGrade | null;
  audit_count: number;
}

export interface VendorList {
  vendors: VendorRead[];
  total: number;
}

export interface UploadResponse {
  document_id: string;
  filename: string;
  pages: number;
  chunks: number;
  message: string;
}

export interface VendorCreate {
  name: string;
  industry?: string;
  website?: string;
  contact_email?: string;
}

export interface AuditRunRequest {
  vendor_id: string;
  document_id: string;
  audit_name?: string;
}
