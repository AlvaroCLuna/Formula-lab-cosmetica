import { z } from "zod";

const purchaseItemSchema = z.object({
  commercialProductId: z.string().optional().nullable(),
  rawMaterialMasterId: z.string().optional().nullable(),
  itemName: z.string().min(2),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1),
  unitPrice: z.coerce.number().nonnegative().optional().default(0),
  taxRate: z.coerce.number().nonnegative().optional().default(0),
  specifications: z.string().optional().nullable()
});

export const purchaseListSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional()
});

export const createPurchaseRequestSchema = z.object({
  origin: z.string().default("inventario"),
  area: z.string().default("Laboratorio"),
  priority: z.enum(["baja", "media", "alta", "urgente"]).default("media"),
  requiredDate: z.coerce.date().optional().nullable(),
  reason: z.string().min(5),
  observations: z.string().optional().nullable(),
  documentId: z.string().optional().nullable(),
  items: z.array(purchaseItemSchema.omit({ unitPrice: true, taxRate: true })).min(1)
});

export const createQuoteSchema = z.object({
  rfqId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  supplierName: z.string().min(2),
  commercialProductId: z.string().optional().nullable(),
  manufacturerName: z.string().optional().nullable(),
  presentation: z.string().optional().nullable(),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().positive(),
  taxRate: z.coerce.number().nonnegative().optional().default(0),
  shippingCost: z.coerce.number().nonnegative().optional().default(0),
  currency: z.enum(["MXN", "USD"]).default("MXN"),
  exchangeRate: z.coerce.number().positive().optional().nullable(),
  minimumPurchase: z.coerce.number().positive().optional().nullable(),
  validUntil: z.coerce.date().optional().nullable(),
  leadTimeDays: z.coerce.number().int().nonnegative().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  availability: z.string().optional().nullable(),
  documentId: z.string().optional().nullable(),
  observations: z.string().optional().nullable()
});

export const createPurchaseOrderSchema = z.object({
  supplierName: z.string().min(2),
  requisitionId: z.string().optional().nullable(),
  quoteId: z.string().optional().nullable(),
  currency: z.enum(["MXN", "USD"]).default("MXN"),
  exchangeRate: z.coerce.number().positive().optional().nullable(),
  promisedDate: z.coerce.date().optional().nullable(),
  terms: z.string().optional().nullable(),
  documentId: z.string().optional().nullable(),
  items: z.array(purchaseItemSchema).min(1)
});

export const approvePurchaseOrderSchema = z.object({
  decision: z.enum(["aprobada", "rechazada"]),
  comment: z.string().optional().nullable(),
  level: z.coerce.number().int().positive().default(1),
  evidenceDocumentId: z.string().optional().nullable()
});

export const createPurchaseReceiptSchema = z.object({
  orderId: z.string(),
  orderItemId: z.string().optional().nullable(),
  expectedQuantity: z.coerce.number().nonnegative(),
  receivedQuantity: z.coerce.number().positive(),
  supplierLotCode: z.string().optional().nullable(),
  remision: z.string().optional().nullable(),
  invoice: z.string().optional().nullable(),
  packageStatus: z.string().optional().nullable(),
  initialStatus: z.string().default("cuarentena"),
  observations: z.string().optional().nullable(),
  documentId: z.string().optional().nullable(),
  inventoryLotId: z.string().optional().nullable(),
  qualityInspectionId: z.string().optional().nullable(),
  authorizedOverReceiptReason: z.string().optional().nullable()
});

export const createPurchaseReturnSchema = z.object({
  orderId: z.string().optional().nullable(),
  lotId: z.string(),
  reason: z.string().min(5),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1),
  evidenceDocumentId: z.string().optional().nullable(),
  disposition: z.string().default("devolver_a_proveedor")
});
