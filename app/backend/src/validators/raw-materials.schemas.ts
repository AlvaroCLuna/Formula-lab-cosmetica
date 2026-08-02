import { z } from "zod";

export const listRawMaterialsSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  family: z.string().optional(),
  status: z.enum(["borrador", "en_revision", "validada", "archivada"]).optional()
});

export const rawMaterialVersionSchema = z.object({
  commercialName: z.string().trim().optional().nullable(),
  commonName: z.string().trim().min(2),
  inci: z.string().trim().optional().nullable(),
  cas: z.string().trim().optional().nullable(),
  ec: z.string().trim().optional().nullable(),
  category: z.string().trim().min(2),
  family: z.string().trim().optional().nullable(),
  cosmeticFunction: z.string().trim().min(2),
  description: z.string().trim().optional().nullable(),
  appearance: z.string().trim().optional().nullable(),
  color: z.string().trim().optional().nullable(),
  odor: z.string().trim().optional().nullable(),
  solubility: z.string().trim().optional().nullable(),
  density: z.string().trim().optional().nullable(),
  ph: z.string().trim().optional().nullable(),
  maxTemperature: z.string().trim().optional().nullable(),
  recommendedTemperature: z.string().trim().optional().nullable(),
  usageRange: z.string().trim().optional().nullable(),
  storageConditions: z.string().trim().optional().nullable(),
  shelfLife: z.string().trim().optional().nullable(),
  contraindications: z.string().trim().optional().nullable(),
  compatibilities: z.string().trim().optional().nullable(),
  incompatibilities: z.string().trim().optional().nullable(),
  allergens: z.string().trim().optional().nullable(),
  observations: z.string().trim().optional().nullable(),
  examplesOfUse: z.string().trim().optional().nullable(),
  evidenceSummary: z.string().trim().optional().nullable(),
  confidenceLevel: z.string().trim().optional()
});

export const createRawMaterialSchema = rawMaterialVersionSchema;
export const updateRawMaterialVersionSchema = rawMaterialVersionSchema.partial();

export const relationSchema = z.object({
  name: z.string().trim().min(2),
  country: z.string().trim().optional().nullable(),
  contact: z.string().trim().optional().nullable()
});

export const commercialProductSchema = z.object({
  tradeName: z.string().trim().min(2),
  manufacturerId: z.string().uuid().optional().nullable(),
  supplierId: z.string().uuid().optional().nullable(),
  sku: z.string().trim().optional().nullable(),
  averageCost: z.number().nonnegative().optional().nullable(),
  currency: z.string().trim().optional().nullable()
});

export const rawMaterialDocumentSchema = z.object({
  documentId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(2),
  documentType: z.enum(["pdf", "tds", "sds", "coa", "imagen", "articulo", "otro"]),
  externalReference: z.string().trim().optional().nullable()
});
