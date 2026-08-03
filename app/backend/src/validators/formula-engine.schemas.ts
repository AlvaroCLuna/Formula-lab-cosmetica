import { z } from "zod";

export const engineQuerySchema = z.object({
  batchSize: z.coerce.number().positive().default(100)
});

export const phaseSchema = z.object({
  name: z.string().trim().min(1),
  orderIndex: z.number().int().nonnegative()
});

export const reorderPhasesSchema = z.object({
  phases: z.array(phaseSchema).min(1)
});

export const moveIngredientSchema = z.object({
  phase: z.string().trim().min(1),
  orderIndex: z.number().int().nonnegative()
});

export const compareEngineSchema = z.object({
  baseVersionId: z.string().uuid(),
  targetVersionId: z.string().uuid()
});
