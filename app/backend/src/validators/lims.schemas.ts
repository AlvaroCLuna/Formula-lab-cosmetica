import { z } from "zod";

export const listLimsSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional()
});

export const createLabProjectSchema = z.object({
  name: z.string().min(3),
  projectType: z.string().min(3),
  objective: z.string().min(5),
  priority: z.enum(["baja", "media", "alta", "urgente"]).default("media"),
  formulationFamilyId: z.string().optional().nullable(),
  formulationVersionId: z.string().optional().nullable(),
  observations: z.string().optional().nullable()
});

export const createLabSampleSchema = z.object({
  projectId: z.string(),
  formulationFamilyId: z.string().optional().nullable(),
  formulationVersionId: z.string().optional().nullable(),
  pilotLotCode: z.string().optional().nullable(),
  quantity: z.coerce.number().positive(),
  unit: z.string().default("g"),
  location: z.string().optional().nullable(),
  storageConditions: z.string().optional().nullable(),
  observations: z.string().optional().nullable()
});

export const createLabTestSchema = z.object({
  sampleId: z.string(),
  methodId: z.string(),
  testType: z.string().min(2),
  unit: z.string().optional().nullable(),
  specification: z.string().optional().nullable(),
  numericResult: z.coerce.number().optional().nullable(),
  qualitativeResult: z.string().optional().nullable(),
  instrumentId: z.string().optional().nullable(),
  evidenceDocumentId: z.string().optional().nullable(),
  observations: z.string().optional().nullable()
});

export const updateLabResultSchema = z.object({
  numericResult: z.coerce.number().optional().nullable(),
  qualitativeResult: z.string().optional().nullable(),
  conformityStatus: z.enum(["pendiente", "conforme", "no_conforme"]).default("pendiente"),
  observations: z.string().optional().nullable()
});

export const invalidateLabTestSchema = z.object({
  reason: z.string().min(5)
});

export const releaseSampleSchema = z.object({
  decision: z.enum(["aprobada", "aprobada_con_observaciones", "rechazada", "pendiente"]),
  conclusion: z.string().min(5),
  digitalConfirmation: z.string().min(3),
  testIds: z.array(z.string()).min(1),
  documentIds: z.array(z.string()).optional().default([])
});
