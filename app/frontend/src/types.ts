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
