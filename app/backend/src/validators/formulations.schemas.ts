import { z } from "zod";

export const createFormulationSchema = z.object({
  name: z.string().trim().min(2),
  category: z.string().trim().min(2),
  objective: z.string().trim().optional(),
  notes: z.string().trim().optional()
});

export const listFormulationsSchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(["activa", "en_desarrollo", "archivada", "obsoleta"]).optional(),
  category: z.string().trim().optional()
});

export const updateVersionSchema = z.object({
  name: z.string().trim().min(2).optional(),
  category: z.string().trim().min(2).optional(),
  objective: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable()
});

export const ingredientSchema = z.object({
  rawMaterialMasterId: z.string().uuid().optional().nullable(),
  displayName: z.string().trim().min(2),
  inci: z.string().trim().optional().nullable(),
  cosmeticFunction: z.string().trim().min(2),
  phase: z.string().trim().min(1),
  percentage: z.number().min(0).max(100),
  baseQuantity: z.number().min(0),
  unit: z.string().trim().min(1).default("g"),
  orderIndex: z.number().int().min(1),
  sourceReference: z.string().trim().optional().nullable()
});

export const compareVersionsSchema = z.object({
  baseVersionId: z.string().uuid(),
  targetVersionId: z.string().uuid()
});
