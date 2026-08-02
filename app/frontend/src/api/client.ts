import type { Draft, LoadedDocument, User, ValidationStatus } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

let token = localStorage.getItem("formulalab_token");

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const data = (await response.json().catch(() => ({}))) as T & { message?: string };
  if (!response.ok) {
    throw new Error(data.message ?? "Error de comunicación con el servidor.");
  }
  return data;
}

export const api = {
  setToken(nextToken: string | null) {
    token = nextToken;
    if (nextToken) {
      localStorage.setItem("formulalab_token", nextToken);
    } else {
      localStorage.removeItem("formulalab_token");
    }
  },
  getToken() {
    return token;
  },
  async login(email: string, password: string) {
    return request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },
  async me() {
    return request<{ user: User }>("/auth/me");
  },
  async prepareRecovery(email: string) {
    return request<{ prepared: boolean; message: string }>("/auth/password-recovery/prepare", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  },
  async listDocuments() {
    return request<{ documents: LoadedDocument[] }>("/documents");
  },
  async uploadDocuments(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return request<{ documents: LoadedDocument[] }>("/documents", { method: "POST", body: formData });
  },
  async latestDraft() {
    return request<{ draft: Draft | null }>("/drafts/latest");
  },
  async updateExtractedValue(id: string, value: string, validationStatus: ValidationStatus = "corregido") {
    return request<{ value: unknown }>(`/drafts/values/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ value, validationStatus })
    });
  },
  async draftAction(id: string, action: "guardar_borrador" | "aprobar" | "rechazar") {
    return request<{ draft: Draft }>(`/drafts/${id}/actions`, {
      method: "POST",
      body: JSON.stringify({ action })
    });
  }
};
