import { z } from "zod";

export const knowledgeSearchSchema = z.object({
  q: z.string().trim().min(1).max(120)
});

export const guidedSelectionSchema = z.object({
  desiredOutcome: z.string().optional(),
  usageZone: z.string().optional(),
  physicalForm: z.string().optional(),
  difficulty: z.string().optional(),
  cosmeticNeed: z.string().optional()
});
