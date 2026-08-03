import { z } from "zod";

export const kdeSearchSchema = z.object({
  q: z.string().optional().default(""),
  type: z.string().optional(),
  status: z.string().optional(),
  tag: z.string().optional()
});

export const documentRelationSchema = z.object({
  entityType: z.string().min(2),
  entityId: z.string().min(2),
  relationType: z.string().min(2).default("evidencia"),
  sourceReference: z.string().optional(),
  confidence: z.coerce.number().min(0).max(1).default(0.8),
  validationStatus: z.string().default("pendiente")
});

export const documentTagSchema = z.object({
  name: z.string().min(2),
  color: z.string().default("#2563eb")
});

export const documentVersionSchema = z.object({
  changeReason: z.string().min(3).default("Nueva version documental")
});
