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
export type AuditLens = "SECURITY" | "FINANCIAL" | "PRIVACY" | "HEALTHCARE" | "AGRICULTURE";

export type RequiredControl =
  | "data_encryption"
  | "incident_response"
  | "multi_factor_authentication"
  | "data_deletion_policy"
  | "revenue_recognition"
  | "budgetary_control"
  | "ifrs_compliance"
  | "internal_audit_logs"
  | "data_sovereignty"
  | "consent_management"
  | "right_to_erasure"
  | "third_party_sharing"
  | "hipaa_compliance"
  | "clinical_data_privacy"
  | "medical_device_security"
  | "ehr_interoperability"
  | "supply_chain_traceability"
  | "fair_trade_audit"
  | "sustainability_reporting"
  | "pesticide_logs_integrity";

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
  entity_risk_multiplier: number;
  sentiment_adjustment: number;
  final_score: number;
  grade: RiskGrade;
  formula_repr: string;
}

export interface AuditResponse {
  report_id: string;
  vendor_id: string;
  vendor_name: string;
  audit_name: string;
  audit_lens: AuditLens;
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
  audit_history?: {
    report_id: string;
    audit_name: string;
    status: AuditStatus;
    final_score: number | null;
    grade: RiskGrade | null;
    created_at: string;
    completed_at: string | null;
  }[];
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
  audit_lens?: AuditLens;
}
