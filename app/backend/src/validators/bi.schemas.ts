import { z } from "zod";

export const biFiltersSchema = z.object({
  module: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  period: z.string().optional()
});

export const reportBuilderSchema = z.object({
  module: z.string().min(2),
  entity: z.string().min(2),
  fields: z.array(z.string()).min(1),
  filters: z.record(z.any()).optional().default({}),
  groupBy: z.array(z.string()).optional().default([]),
  order: z.record(z.any()).optional().default({}),
  period: z.record(z.any()).optional().default({}),
  format: z.enum(["csv", "xlsx", "pdf", "json"]).default("csv"),
  title: z.string().min(3),
  description: z.string().optional().nullable(),
  columns: z.array(z.string()).optional().default([]),
  totals: z.array(z.string()).optional().default([])
});

export const exportReportSchema = z.object({
  reportId: z.string().optional().nullable(),
  module: z.string().min(2),
  format: z.enum(["csv", "xlsx", "pdf", "json"]),
  filters: z.record(z.any()).optional().default({})
});
