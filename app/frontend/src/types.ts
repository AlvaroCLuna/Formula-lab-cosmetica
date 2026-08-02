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

export type RawMaterialMaster = {
  id: string;
  permanentCode: string;
  commonName: string;
  inci: string | null;
  status: string;
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
