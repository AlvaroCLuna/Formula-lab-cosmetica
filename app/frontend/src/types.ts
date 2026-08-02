export type User = {
  id: string;
  organizationId: string;
  email: string;
  fullName: string;
  status: string;
};

export type DocumentStatus = "pendiente" | "procesando" | "procesado" | "requiere_revision" | "rechazado";
export type ValidationStatus = "pendiente" | "validado" | "corregido" | "en_conflicto" | "rechazado";

export type ExtractedValue = {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  value: string | null;
  sourceDocumentName: string;
  sourceReference: string;
  dataType: string;
  evidenceType: "documental" | "inferido";
  confidence: number;
  validationStatus: ValidationStatus;
};

export type LoadedDocument = {
  id: string;
  originalFilename: string;
  fileExtension: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  rejectionReason: string | null;
  createdAt: string;
  extractedValues?: ExtractedValue[];
};

export type Draft = {
  id: string;
  status: "borrador" | "aprobado" | "rechazado";
  extractedValues: ExtractedValue[];
};

export type RawMaterialVersionStatus = "borrador" | "en_revision" | "validada" | "rechazada" | "obsoleta";

export type RawMaterialMasterVersion = {
  id: string;
  rawMaterialMasterId: string;
  versionNumber: number;
  status: RawMaterialVersionStatus;
  commercialName: string | null;
  commonName: string;
  inci: string | null;
  cas: string | null;
  ec: string | null;
  category: string;
  family: string | null;
  cosmeticFunction: string;
  description: string | null;
  appearance: string | null;
  color: string | null;
  odor: string | null;
  solubility: string | null;
  density: string | null;
  ph: string | null;
  maxTemperature: string | null;
  recommendedTemperature: string | null;
  usageRange: string | null;
  storageConditions: string | null;
  shelfLife: string | null;
  contraindications: string | null;
  compatibilities: string | null;
  incompatibilities: string | null;
  allergens: string | null;
  observations: string | null;
  examplesOfUse: string | null;
  evidenceSummary: string | null;
  confidenceLevel: string;
};

export type RawMaterialRelation = {
  id: string;
  name?: string;
  tradeName?: string;
  title?: string;
  documentType?: string;
  averageCost?: number | null;
  status: string;
};

export type RawMaterialIntelligence = {
  formulationCount: number;
  averageUsage?: number | null;
  supplierCount: number;
  documentCount: number;
  averageCost?: number | null;
  lastUpdatedAt: string;
  formulations?: Array<{ id: string; name: string; versionNumber: number; percentage: number }>;
};

export type RawMaterialLearning = {
  name: string;
  inci: string;
  function: string;
  description: string;
  examplesOfUse: string;
  formulations: Array<{ id: string; name: string; versionNumber: number; percentage: number }>;
};

export type RawMaterialMaster = {
  id: string;
  permanentCode: string;
  commercialName: string | null;
  commonName: string;
  inci: string | null;
  cas?: string | null;
  ec?: string | null;
  category?: string | null;
  family?: string | null;
  cosmeticFunction?: string | null;
  status: "borrador" | "en_revision" | "validada" | "archivada" | string;
  currentVersionId?: string | null;
  updatedAt?: string;
  versions?: RawMaterialMasterVersion[];
  suppliers?: RawMaterialRelation[];
  manufacturers?: RawMaterialRelation[];
  products?: RawMaterialRelation[];
  documents?: RawMaterialRelation[];
  lots?: RawMaterialRelation[];
  intelligence?: RawMaterialIntelligence;
};

export type FormulationIngredient = {
  id: string;
  rawMaterialMasterId: string | null;
  displayName: string;
  inci: string | null;
  cosmeticFunction: string;
  phase: string;
  percentage: number;
  baseQuantity: number;
  unit: string;
  orderIndex: number;
  sourceType: "materia_prima_maestra" | "provisional";
  sourceReference: string | null;
};

export type FormulationVersion = {
  id: string;
  formulationFamilyId: string;
  versionNumber: number;
  status: "borrador" | "en_revision" | "aprobada" | "rechazada" | "obsoleta";
  name: string;
  category: string;
  objective: string | null;
  notes: string | null;
  approvedAt: string | null;
  ingredients: FormulationIngredient[];
};

export type FormulationFamily = {
  id: string;
  permanentCode: string;
  name: string;
  category: string;
  status: "activa" | "en_desarrollo" | "archivada" | "obsoleta";
  currentVersionId: string | null;
  versions: FormulationVersion[];
};

export type LearningCard = {
  name: string;
  cosmeticFunction: string;
  inci: string;
  source: string;
  confidence: string;
};

export type FormulationComparison = {
  baseVersion: number;
  targetVersion: number;
  metadata: {
    nameChanged: boolean;
    categoryChanged: boolean;
    notesChanged: boolean;
  };
  ingredients: {
    added: FormulationIngredient[];
    removed: FormulationIngredient[];
    modified: Array<{ ingredient: string; changes: Record<string, unknown> }>;
  };
};
