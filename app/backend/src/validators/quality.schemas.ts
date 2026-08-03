import { z } from "zod";

export const listQualitySchema = z.object({ search: z.string().optional(), status: z.string().optional() });

export const createInspectionSchema = z.object({
  lotId: z.string().optional().nullable(),
  supplierName: z.string().optional().nullable(),
  receivedQuantity: z.coerce.number().optional().nullable(),
  unit: z.string().optional().nullable(),
  packageIntegrity: z.string().optional().nullable(),
  identification: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  odor: z.string().optional().nullable(),
  appearance: z.string().optional().nullable(),
  initialResult: z.string().optional().nullable(),
  observations: z.string().optional().nullable(),
  specificationId: z.string().optional().nullable(),
  evidenceDocumentId: z.string().optional().nullable()
});

export const createReleaseSchema = z.object({
  releaseType: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  inspectionId: z.string().optional().nullable(),
  specificationId: z.string(),
  decision: z.enum(["liberar", "reprocesar", "reclasificar", "devolver", "destruir", "usar_bajo_desviacion", "mantener_en_cuarentena", "rechazar"]),
  conclusion: z.string().min(5),
  reason: z.string().min(5),
  digitalConfirmation: z.string().min(3),
  evidenceDocumentId: z.string().optional().nullable()
});

export const createDeviationSchema = z.object({
  deviationType: z.string(),
  description: z.string().min(5),
  severity: z.string(),
  affectedEntityType: z.string(),
  affectedEntityId: z.string().optional().nullable(),
  preliminaryCause: z.string().optional().nullable(),
  containment: z.string().min(5),
  evidenceDocumentId: z.string().optional().nullable()
});

export const createNcfSchema = z.object({
  origin: z.string(),
  ncfType: z.string(),
  severity: z.string(),
  lotId: z.string().optional().nullable(),
  productName: z.string().optional().nullable(),
  supplierName: z.string().optional().nullable(),
  productionOrderId: z.string().optional().nullable(),
  labReferenceId: z.string().optional().nullable(),
  description: z.string().min(5),
  evidenceDocumentId: z.string().optional().nullable()
});

export const createCapaSchema = z.object({
  actionText: z.string().min(5),
  actionType: z.string(),
  targetDate: z.coerce.date(),
  priority: z.enum(["baja", "media", "alta", "urgente"]).default("media"),
  rootCause: z.string().optional().nullable(),
  evidenceDocumentId: z.string().optional().nullable(),
  effectivenessCheck: z.string().optional().nullable(),
  deviationId: z.string().optional().nullable(),
  nonConformityId: z.string().optional().nullable()
});

export const createDispositionSchema = z.object({
  entityType: z.string(),
  entityId: z.string(),
  decision: z.enum(["liberar", "reprocesar", "reclasificar", "devolver", "destruir", "usar_bajo_desviacion", "mantener_en_cuarentena", "rechazar"]),
  reason: z.string().min(5),
  evidenceDocumentId: z.string().optional().nullable(),
  nonConformityId: z.string().optional().nullable()
});
