// VendGuard — Typed API Client
// All backend communication goes through this module.

import type {
  AuditResponse,
  AuditRunRequest,
  UploadResponse,
  VendorCreate,
  VendorList,
  VendorRead,
} from "@/types/audit";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("vr_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new ApiError(response.status, error.detail ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

// ── Vendors ───────────────────────────────────────────────────────────────────

export const vendorsApi = {
  list: (): Promise<VendorList> => request<VendorList>("/api/v1/vendors"),

  create: (payload: VendorCreate): Promise<VendorRead> =>
    request<VendorRead>("/api/v1/vendors", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  get: (vendorId: string): Promise<VendorRead> =>
    request<VendorRead>(`/api/v1/vendors/${vendorId}`),
};

// ── Audit ─────────────────────────────────────────────────────────────────────

export const auditApi = {
  upload: async (vendorId: string, file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("vendor_id", vendorId);

    const headers: Record<string, string> = {};
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("vr_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${BASE_URL}/api/v1/audit/upload`, {
      method: "POST",
      body: formData,
      headers,
      // Don't set Content-Type — browser sets multipart boundary automatically
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Upload failed" }));
      throw new ApiError(response.status, error.detail);
    }

    return response.json() as Promise<UploadResponse>;
  },

  run: (payload: AuditRunRequest): Promise<AuditResponse> =>
    request<AuditResponse>("/api/v1/audit/run", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  get: (reportId: string): Promise<AuditResponse> =>
    request<AuditResponse>(`/api/v1/audit/${reportId}`),
};

export { ApiError };
