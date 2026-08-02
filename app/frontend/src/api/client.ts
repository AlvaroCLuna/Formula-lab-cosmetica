import type { Draft, FormulationComparison, FormulationFamily, FormulationIngredient, FormulationVersion, LearningCard, LoadedDocument, RawMaterialMaster, User, ValidationStatus } from "../types";

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
  },
  async listFormulations(filters: { search?: string; status?: string; category?: string } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const suffix = params.toString() ? `?${params}` : "";
    return request<{ formulations: FormulationFamily[] }>(`/formulations${suffix}`);
  },
  async createFormulation(input: { name: string; category: string; objective?: string; notes?: string }) {
    return request<{ formulation: FormulationFamily }>("/formulations", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },
  async getFormulation(id: string) {
    return request<{ formulation: FormulationFamily }>(`/formulations/${id}`);
  },
  async quickView(id: string) {
    return request<{ formulation: FormulationFamily; learningCards: LearningCard[] }>(`/formulations/${id}/quick-view`);
  },
  async listVersions(id: string) {
    return request<{ versions: FormulationVersion[] }>(`/formulations/${id}/versions`);
  },
  async createVersion(id: string) {
    return request<{ version: FormulationVersion }>(`/formulations/${id}/versions`, { method: "POST" });
  },
  async updateVersion(id: string, input: Partial<Pick<FormulationVersion, "name" | "category" | "objective" | "notes">>) {
    return request<{ version: FormulationVersion }>(`/formulations/versions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  },
  async submitVersion(id: string) {
    return request<{ version: FormulationVersion }>(`/formulations/versions/${id}/submit-review`, { method: "POST" });
  },
  async approveVersion(id: string) {
    return request<{ version: FormulationVersion; snapshot: unknown }>(`/formulations/versions/${id}/approve`, { method: "POST" });
  },
  async rejectVersion(id: string) {
    return request<{ version: FormulationVersion }>(`/formulations/versions/${id}/reject`, { method: "POST" });
  },
  async addIngredient(versionId: string, input: Omit<FormulationIngredient, "id" | "sourceType">) {
    return request<{ ingredient: FormulationIngredient }>(`/formulations/versions/${versionId}/ingredients`, {
      method: "POST",
      body: JSON.stringify(input)
    });
  },
  async updateIngredient(id: string, input: Partial<Omit<FormulationIngredient, "id" | "sourceType">>) {
    return request<{ ingredient: FormulationIngredient }>(`/formulations/ingredients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  },
  async removeIngredient(id: string) {
    return request<{ ingredient: FormulationIngredient }>(`/formulations/ingredients/${id}`, { method: "DELETE" });
  },
  async compareVersions(formulationId: string, baseVersionId: string, targetVersionId: string) {
    const params = new URLSearchParams({ baseVersionId, targetVersionId });
    return request<{ comparison: FormulationComparison }>(`/formulations/${formulationId}/compare?${params}`);
  },
  async saveComparison(formulationId: string, baseVersionId: string, targetVersionId: string) {
    return request<{ comparison: FormulationComparison }>(`/formulations/${formulationId}/compare`, {
      method: "POST",
      body: JSON.stringify({ baseVersionId, targetVersionId })
    });
  },
  async listRawMaterials() {
    return request<{ rawMaterials: RawMaterialMaster[] }>("/formulations/catalog/raw-materials");
  }
};
