import { z } from "zod";

export const graphSearchSchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
  module: z.string().optional()
});

export const createRelationSchema = z.object({
  fromEntityId: z.string().min(1),
  toEntityId: z.string().min(1),
  relationTypeCode: z.string().min(1),
  direction: z.string().default("directa"),
  weight: z.coerce.number().min(0).max(10).default(1),
  evidence: z.string().min(3),
  evidenceDocumentId: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).default({})
});

export const graphQuerySchema = z.object({
  entityId: z.string().optional(),
  depth: z.coerce.number().int().min(1).max(3).default(2)
});
