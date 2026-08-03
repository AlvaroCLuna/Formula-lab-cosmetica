import { z } from "zod";

export const aiListSchema = z.object({ type: z.string().optional(), status: z.string().optional(), severity: z.string().optional() });

export const createRuleSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(5),
  ruleType: z.string().min(3),
  conditionJson: z.record(z.any()),
  severity: z.enum(["informativa", "baja", "media", "alta", "critica"]).default("media"),
  resultMessage: z.string().min(5),
  source: z.string().min(3),
  evidenceDocumentId: z.string().optional().nullable(),
  confidence: z.coerce.number().min(0).max(1).default(0.8)
});

export const evaluateRulesSchema = z.object({
  entityType: z.string().min(2),
  entityId: z.string().min(1),
  data: z.record(z.any()),
  ruleType: z.string().optional().nullable()
});

export const askAiSchema = z.object({
  queryText: z.string().min(4),
  moduleScope: z.string().optional().nullable(),
  entityType: z.string().optional().nullable(),
  entityId: z.string().optional().nullable()
});

export const learningEventSchema = z.object({
  context: z.string().min(3),
  inputJson: z.record(z.any()),
  proposedOutputJson: z.record(z.any()).optional().nullable(),
  correctionJson: z.record(z.any()).optional().nullable(),
  entityType: z.string().optional().nullable(),
  entityId: z.string().optional().nullable(),
  modelOrRule: z.string().optional().nullable()
});
