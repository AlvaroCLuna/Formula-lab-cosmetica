import type { Draft, FormulaEnginePhase, FormulaEngineState, FormulationComparison, FormulationFamily, FormulationIngredient, FormulationVersion, KdeDocument, LabProject, LabSample, LabTest, LearningCard, LoadedDocument, RawMaterialLearning, RawMaterialMaster, RawMaterialMasterVersion, User, ValidationStatus } from "../types";

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
  async kdeDashboard() {
    return request<{ indicators: any }>("/kde/dashboard");
  },
  async kdeTypes() {
    return request<{ types: any[] }>("/kde/types");
  },
  async kdeTags() {
    return request<{ tags: any[] }>("/kde/tags");
  },
  async listKdeDocuments(filters: { q?: string; type?: string; status?: string; tag?: string } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    return request<{ documents: KdeDocument[] }>(`/kde/documents${params.toString() ? `?${params}` : ""}`);
  },
  async uploadKdeDocuments(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return request<{ documents: KdeDocument[] }>("/kde/documents", { method: "POST", body: formData });
  },
  async getKdeDocument(id: string) {
    return request<{ document: KdeDocument }>(`/kde/documents/${id}`);
  },
  async addKdeTag(id: string, input: { name: string; color?: string }) {
    return request<{ tag: any; link: any }>(`/kde/documents/${id}/tags`, { method: "POST", body: JSON.stringify(input) });
  },
  async addKdeRelation(id: string, input: Record<string, unknown>) {
    return request<{ relation: any }>(`/kde/documents/${id}/relations`, { method: "POST", body: JSON.stringify(input) });
  },
  async limsDashboard() {
    return request<{ indicators: any }>("/lims/dashboard");
  },
  async listLabProjects(filters: { search?: string; status?: string } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    return request<{ projects: LabProject[] }>(`/lims/projects${params.toString() ? `?${params}` : ""}`);
  },
  async createLabProject(input: Record<string, unknown>) {
    return request<{ project: LabProject }>("/lims/projects", { method: "POST", body: JSON.stringify(input) });
  },
  async listLabSamples(filters: { search?: string; status?: string } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    return request<{ samples: LabSample[] }>(`/lims/samples${params.toString() ? `?${params}` : ""}`);
  },
  async createLabSample(input: Record<string, unknown>) {
    return request<{ sample: LabSample }>("/lims/samples", { method: "POST", body: JSON.stringify(input) });
  },
  async listLabMethods() {
    return request<{ methods: any[] }>("/lims/methods");
  },
  async listLabInstruments() {
    return request<{ instruments: any[] }>("/lims/instruments");
  },
  async listLabTests(filters: { search?: string; status?: string } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    return request<{ tests: LabTest[] }>(`/lims/tests${params.toString() ? `?${params}` : ""}`);
  },
  async createLabTest(input: Record<string, unknown>) {
    return request<{ test: LabTest }>("/lims/tests", { method: "POST", body: JSON.stringify(input) });
  },
  async updateLabResult(id: string, input: Record<string, unknown>) {
    return request<{ test: LabTest }>(`/lims/tests/${id}/result`, { method: "PATCH", body: JSON.stringify(input) });
  },
  async invalidateLabTest(id: string, reason: string) {
    return request<{ test: LabTest }>(`/lims/tests/${id}/invalidate`, { method: "POST", body: JSON.stringify({ reason }) });
  },
  async repeatLabTest(id: string, reason: string) {
    return request<{ test: LabTest }>(`/lims/tests/${id}/repeat`, { method: "POST", body: JSON.stringify({ reason }) });
  },
  async listStabilityStudies() {
    return request<{ studies: any[] }>("/lims/stability");
  },
  async listLabNonConformities() {
    return request<{ nonConformities: any[] }>("/lims/non-conformities");
  },
  async releaseLabSample(id: string, input: Record<string, unknown>) {
    return request<{ release: any }>(`/lims/samples/${id}/release`, { method: "POST", body: JSON.stringify(input) });
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
  },
  async getFormulaEngine(versionId: string, batchSize = 100) {
    return request<FormulaEngineState & { version: FormulationVersion }>(`/formula-engine/versions/${versionId}?batchSize=${batchSize}`);
  },
  async addFormulaPhase(versionId: string, input: { name: string; orderIndex: number }) {
    return request<{ phase: FormulaEnginePhase }>(`/formula-engine/versions/${versionId}/phases`, {
      method: "POST",
      body: JSON.stringify(input)
    });
  },
  async reorderFormulaPhases(versionId: string, phases: Array<{ name: string; orderIndex: number }>) {
    return request<{ phases: FormulaEnginePhase[] }>(`/formula-engine/versions/${versionId}/phases/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ phases })
    });
  },
  async moveFormulaIngredient(id: string, input: { phase: string; orderIndex: number }) {
    return request<{ ingredient: FormulationIngredient }>(`/formula-engine/ingredients/${id}/move`, {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  },
  async compareFormulaEngine(baseVersionId: string, targetVersionId: string) {
    const params = new URLSearchParams({ baseVersionId, targetVersionId });
    return request<{ comparison: unknown }>(`/formula-engine/compare?${params}`);
  },
  async simulateCost(versionId: string, input: Record<string, unknown>) {
    return request<{ result: any }>(`/cost-engine/versions/${versionId}/simulate`, {
      method: "POST",
      body: JSON.stringify(input)
    });
  },
  async saveCostScenario(versionId: string, input: Record<string, unknown>) {
    return request<{ scenario: any; result: any }>(`/cost-engine/versions/${versionId}/scenarios`, {
      method: "POST",
      body: JSON.stringify(input)
    });
  },
  async listCostScenarios(versionId: string) {
    return request<{ scenarios: any[] }>(`/cost-engine/versions/${versionId}/scenarios`);
  },
  async inventoryDashboard() {
    return request<{ indicators: any; warehouseStock: Record<string, number>; movements: any[] }>("/inventory/dashboard");
  },
  async listInventoryLots(filters: { search?: string; status?: string } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    return request<{ lots: any[] }>(`/inventory/lots${params.toString() ? `?${params}` : ""}`);
  },
  async lotKardex(id: string) {
    return request<{ movements: any[] }>(`/inventory/lots/${id}/kardex`);
  },
  async inventoryAvailability(formulationVersionId: string, batchSize = 1000) {
    return request<{ rows: any[]; batchSize: number }>(`/inventory/availability?formulationVersionId=${formulationVersionId}&batchSize=${batchSize}`);
  },
  async inventoryMovement(id: string, input: Record<string, unknown>) {
    return request<{ lot: any; movement: any }>(`/inventory/lots/${id}/movements`, { method: "POST", body: JSON.stringify(input) });
  },
  async productionDashboard() {
    return request<{ indicators: any }>("/production/dashboard");
  },
  async listProductionOrders(filters: { search?: string; status?: string; priority?: string } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    return request<{ orders: any[] }>(`/production/orders${params.toString() ? `?${params}` : ""}`);
  },
  async getProductionOrder(id: string) {
    return request<{ order: any; theoretical: any }>(`/production/orders/${id}`);
  },
  async createProductionOrder(input: Record<string, unknown>) {
    return request<{ order: any }>("/production/orders", { method: "POST", body: JSON.stringify(input) });
  },
  async transitionProductionOrder(id: string, input: Record<string, unknown>) {
    return request<{ order: any }>(`/production/orders/${id}/transition`, { method: "POST", body: JSON.stringify(input) });
  },
  async updateProductionChecklist(id: string, completed: boolean) {
    return request<{ item: any }>(`/production/checklist/${id}`, { method: "PATCH", body: JSON.stringify({ completed }) });
  },
  async confirmProductionConsumption(id: string, input: Record<string, unknown>) {
    return request<{ consumption: any }>(`/production/consumptions/${id}/confirm`, { method: "POST", body: JSON.stringify(input) });
  },
  async addProductionLog(id: string, input: Record<string, unknown>) {
    return request<{ log: any }>(`/production/orders/${id}/logs`, { method: "POST", body: JSON.stringify(input) });
  },
  async addProductionParameter(id: string, input: Record<string, unknown>) {
    return request<{ parameter: any }>(`/production/orders/${id}/parameters`, { method: "POST", body: JSON.stringify(input) });
  },
  async knowledgeCategories() {
    return request<{ categories: any[] }>("/knowledge-center/categories");
  },
  async knowledgeProducts() {
    return request<{ products: any[] }>("/knowledge-center/products");
  },
  async knowledgeFamilies() {
    return request<{ families: any[] }>("/knowledge-center/families");
  },
  async knowledgeNeeds() {
    return request<{ needs: any[] }>("/knowledge-center/needs");
  },
  async knowledgeNeed(id: string) {
    return request<{ need: any; products: any[]; families: any[]; rawMaterials: any[]; formulations: any[]; equipment: any; controls: any }>(`/knowledge-center/needs/${id}`);
  },
  async knowledgeGlossary() {
    return request<{ terms: any[] }>("/knowledge-center/glossary");
  },
  async knowledgeSearch(q: string) {
    return request<{ products: any[]; families: any[]; needs: any[] }>(`/knowledge-center/search?q=${encodeURIComponent(q)}`);
  },
  async guidedKnowledgeSelection(input: Record<string, unknown>) {
    return request<{ rules: any[]; products: any[]; families: any[]; rawMaterials: any[] }>("/knowledge-center/guided-selection", { method: "POST", body: JSON.stringify(input) });
  },
  async listMasterRawMaterials(filters: { search?: string; status?: string; category?: string; family?: string } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const suffix = params.toString() ? `?${params}` : "";
    return request<{ rawMaterials: RawMaterialMaster[] }>(`/raw-materials${suffix}`);
  },
  async createMasterRawMaterial(input: Partial<RawMaterialMasterVersion>) {
    return request<{ rawMaterial: RawMaterialMaster }>("/raw-materials", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },
  async getMasterRawMaterial(id: string) {
    return request<{ rawMaterial: RawMaterialMaster; intelligence: NonNullable<RawMaterialMaster["intelligence"]> }>(`/raw-materials/${id}`);
  },
  async quickRawMaterial(id: string) {
    return request<{ rawMaterial: RawMaterialMaster; intelligence: NonNullable<RawMaterialMaster["intelligence"]>; learning: RawMaterialLearning }>(`/raw-materials/${id}/quick-view`);
  },
  async updateRawMaterialVersion(id: string, input: Partial<RawMaterialMasterVersion>) {
    return request<{ version: RawMaterialMasterVersion }>(`/raw-materials/versions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  },
  async submitRawMaterialVersion(id: string) {
    return request<{ version: RawMaterialMasterVersion }>(`/raw-materials/versions/${id}/submit-review`, { method: "POST" });
  },
  async approveRawMaterialVersion(id: string) {
    return request<{ version: RawMaterialMasterVersion; snapshot: unknown }>(`/raw-materials/versions/${id}/approve`, { method: "POST" });
  },
  async createRawMaterialVersion(id: string) {
    return request<{ version: RawMaterialMasterVersion }>(`/raw-materials/${id}/versions`, { method: "POST" });
  },
  async archiveRawMaterial(id: string) {
    return request<{ rawMaterial: RawMaterialMaster }>(`/raw-materials/${id}/archive`, { method: "POST" });
  }
};
