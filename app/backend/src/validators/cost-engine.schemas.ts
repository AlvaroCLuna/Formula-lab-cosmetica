import { z } from "zod";

export const costScenarioSchema = z.object({
  name: z.string().trim().min(2).default("Escenario de costo"),
  batchSize: z.number().positive(),
  currency: z.enum(["MXN", "USD"]).default("MXN"),
  exchangeRate: z.number().positive().default(1),
  providerStrategy: z.enum(["precio_reciente", "precio_bajo"]).default("precio_reciente"),
  additionalCosts: z.record(z.number().min(0)).default({}),
  marginPercent: z.number().min(0).max(99).default(0),
  markupPercent: z.number().min(0).default(0)
});

export const priceHistorySchema = z.object({
  newPrice: z.number().positive(),
  currency: z.enum(["MXN", "USD"]).default("MXN"),
  taxRate: z.number().min(0).default(0),
  shippingCost: z.number().min(0).default(0),
  validUntil: z.string().datetime().optional().nullable(),
  reason: z.string().trim().optional().nullable(),
  evidenceReference: z.string().trim().optional().nullable()
});
