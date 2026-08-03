import { z } from "zod";

const salesItemSchema = z.object({
  productId: z.string(),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1),
  unitPrice: z.coerce.number().positive(),
  discountRate: z.coerce.number().min(0).max(100).default(0),
  taxRate: z.coerce.number().min(0).max(100).default(0)
});

export const salesListSchema = z.object({ search: z.string().optional(), status: z.string().optional(), stage: z.string().optional() });

export const createLeadSchema = z.object({
  commercialName: z.string().min(2),
  legalName: z.string().optional().nullable(),
  personType: z.string().default("moral"),
  industry: z.string().optional().nullable(),
  segment: z.string().optional().nullable(),
  channel: z.string().optional().nullable(),
  origin: z.string().optional().nullable(),
  priority: z.enum(["baja", "media", "alta", "urgente"]).default("media"),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().default("Mexico"),
  website: z.string().optional().nullable(),
  observations: z.string().optional().nullable(),
  tagsJson: z.array(z.string()).optional().nullable(),
  documentId: z.string().optional().nullable()
});

export const convertLeadSchema = z.object({
  customerType: z.string().default("B2B"),
  commercialTerms: z.string().optional().nullable(),
  currency: z.enum(["MXN", "USD"]).default("MXN"),
  addressesJson: z.any().optional().nullable()
});

export const createOpportunitySchema = z.object({
  leadId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  name: z.string().min(3),
  productsInterestJson: z.any().optional().nullable(),
  estimatedQuantity: z.coerce.number().positive().optional().nullable(),
  estimatedValue: z.coerce.number().nonnegative(),
  currency: z.enum(["MXN", "USD"]).default("MXN"),
  probability: z.coerce.number().int().min(0).max(100).default(25),
  estimatedCloseDate: z.coerce.date().optional().nullable(),
  competition: z.string().optional().nullable(),
  need: z.string().optional().nullable(),
  observations: z.string().optional().nullable()
});

export const createSalesQuoteSchema = z.object({
  customerId: z.string(),
  opportunityId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  currency: z.enum(["MXN", "USD"]).default("MXN"),
  exchangeRate: z.coerce.number().positive().optional().nullable(),
  shippingTotal: z.coerce.number().nonnegative().default(0),
  validUntil: z.coerce.date().optional().nullable(),
  conditions: z.string().optional().nullable(),
  estimatedDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable(),
  documentId: z.string().optional().nullable(),
  items: z.array(salesItemSchema).min(1)
});

export const approveSalesQuoteSchema = z.object({
  approvalType: z.string().default("descuento"),
  decision: z.enum(["aprobada", "rechazada"]),
  comment: z.string().optional().nullable(),
  reason: z.string().min(5),
  evidenceDocumentId: z.string().optional().nullable()
});

export const createSalesOrderSchema = z.object({
  quoteId: z.string().optional().nullable(),
  customerId: z.string(),
  requestedDate: z.coerce.date().optional().nullable(),
  promisedDate: z.coerce.date().optional().nullable(),
  deliveryAddressJson: z.any().optional().nullable(),
  observations: z.string().optional().nullable(),
  documentId: z.string().optional().nullable(),
  items: z.array(salesItemSchema).min(1)
});

export const confirmSalesOrderSchema = z.object({
  confirm: z.boolean().default(true),
  acknowledgement: z.string().min(5)
});

export const createDeliverySchema = z.object({
  orderId: z.string(),
  itemsJson: z.array(z.object({ orderItemId: z.string(), quantity: z.coerce.number().positive(), lotId: z.string().optional().nullable(), qualityStatus: z.string().optional().nullable() })).min(1),
  lotIdsJson: z.array(z.string()).optional().nullable(),
  deliveredAt: z.coerce.date().optional().nullable(),
  addressJson: z.any().optional().nullable(),
  carrierPrepared: z.string().optional().nullable(),
  evidenceDocumentId: z.string().optional().nullable(),
  status: z.string().default("preparada")
});
