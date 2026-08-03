import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { recordAudit } from "../services/audit.service.js";
import { approveSalesQuote, availabilityForOrder, confirmSalesOrder, convertLeadToCustomer, createDelivery, createLead, createOpportunity, createSalesOrder, createSalesQuote, salesDashboard } from "../services/sales.service.js";
import { approveSalesQuoteSchema, confirmSalesOrderSchema, convertLeadSchema, createDeliverySchema, createLeadSchema, createOpportunitySchema, createSalesOrderSchema, createSalesQuoteSchema, salesListSchema } from "../validators/sales.schemas.js";

export const salesRouter = Router();
salesRouter.use(requireAuth);

function salesError(error: unknown, res: import("express").Response, next: import("express").NextFunction) {
  if (error instanceof Error && /requiere|No se puede|producto|cotizacion|pedido|calidad|formulacion/i.test(error.message)) return res.status(409).json({ message: error.message });
  return next(error);
}

salesRouter.get("/dashboard", async (req, res, next) => {
  try {
    return res.json(await salesDashboard(req.user!.organizationId));
  } catch (error) {
    return next(error);
  }
});

salesRouter.get("/leads", async (req, res, next) => {
  try {
    const query = salesListSchema.parse(req.query);
    const leads = await prisma.crmLead.findMany({ where: { organizationId: req.user!.organizationId, ...(query.status ? { status: query.status as never } : {}), ...(query.search ? { OR: [{ permanentCode: { contains: query.search } }, { commercialName: { contains: query.search } }, { legalName: { contains: query.search } }] } : {}) }, include: { contacts: true, opportunities: true, responsible: true, document: true }, orderBy: { updatedAt: "desc" } });
    return res.json({ leads });
  } catch (error) {
    return next(error);
  }
});

salesRouter.post("/leads", async (req, res, next) => {
  try {
    const input = createLeadSchema.parse(req.body);
    const lead = await createLead({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "crm_lead", entityId: lead.id, action: "crm_prospecto_creado", after: lead });
    return res.status(201).json({ lead });
  } catch (error) {
    return salesError(error, res, next);
  }
});

salesRouter.post("/leads/:id/convert", async (req, res, next) => {
  try {
    const input = convertLeadSchema.parse(req.body);
    const customer = await convertLeadToCustomer({ organizationId: req.user!.organizationId, leadId: req.params.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "crm_customer", entityId: customer.id, action: "crm_prospecto_convertido", after: customer });
    return res.json({ customer });
  } catch (error) {
    return salesError(error, res, next);
  }
});

salesRouter.get("/customers", async (req, res, next) => {
  try {
    const customers = await prisma.crmCustomer.findMany({ where: { organizationId: req.user!.organizationId }, include: { lead: true, contacts: true, opportunities: true, quotes: true, orders: true, document: true }, orderBy: { updatedAt: "desc" } });
    return res.json({ customers });
  } catch (error) {
    return next(error);
  }
});

salesRouter.get("/contacts", async (req, res, next) => {
  try {
    const contacts = await prisma.crmContact.findMany({ where: { organizationId: req.user!.organizationId }, include: { lead: true, customer: true }, orderBy: { createdAt: "desc" } });
    return res.json({ contacts });
  } catch (error) {
    return next(error);
  }
});

salesRouter.get("/activities", async (req, res, next) => {
  try {
    const activities = await prisma.crmActivity.findMany({ where: { organizationId: req.user!.organizationId }, include: { lead: true, customer: true, responsible: true, evidenceDocument: true }, orderBy: { scheduledAt: "desc" } });
    return res.json({ activities });
  } catch (error) {
    return next(error);
  }
});

salesRouter.get("/opportunities", async (req, res, next) => {
  try {
    const query = salesListSchema.parse(req.query);
    const opportunities = await prisma.crmOpportunity.findMany({ where: { organizationId: req.user!.organizationId, ...(query.stage ? { stage: query.stage as never } : {}) }, include: { lead: true, customer: true, quotes: true, responsible: true }, orderBy: { updatedAt: "desc" } });
    return res.json({ opportunities });
  } catch (error) {
    return next(error);
  }
});

salesRouter.post("/opportunities", async (req, res, next) => {
  try {
    const input = createOpportunitySchema.parse(req.body);
    const opportunity = await createOpportunity({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "crm_opportunity", entityId: opportunity.id, action: "crm_oportunidad_creada", after: opportunity });
    return res.status(201).json({ opportunity });
  } catch (error) {
    return salesError(error, res, next);
  }
});

salesRouter.get("/products", async (req, res, next) => {
  try {
    const products = await prisma.salesProduct.findMany({ where: { organizationId: req.user!.organizationId }, include: { document: true }, orderBy: { updatedAt: "desc" } });
    return res.json({ products });
  } catch (error) {
    return next(error);
  }
});

salesRouter.get("/price-lists", async (req, res, next) => {
  try {
    const lists = await prisma.salesPriceList.findMany({ where: { organizationId: req.user!.organizationId }, orderBy: { createdAt: "desc" } });
    return res.json({ lists });
  } catch (error) {
    return next(error);
  }
});

salesRouter.get("/quotes", async (req, res, next) => {
  try {
    const quotes = await prisma.salesQuote.findMany({ where: { organizationId: req.user!.organizationId }, include: { customer: true, opportunity: true, contact: true, items: { include: { product: true } }, approvals: true, document: true }, orderBy: { updatedAt: "desc" } });
    return res.json({ quotes });
  } catch (error) {
    return next(error);
  }
});

salesRouter.post("/quotes", async (req, res, next) => {
  try {
    const input = createSalesQuoteSchema.parse(req.body);
    const quote = await createSalesQuote({ organizationId: req.user!.organizationId, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "sales_quote", entityId: quote.id, action: "ventas_cotizacion_creada", after: quote });
    return res.status(201).json({ quote });
  } catch (error) {
    return salesError(error, res, next);
  }
});

salesRouter.post("/quotes/:id/approve", async (req, res, next) => {
  try {
    const input = approveSalesQuoteSchema.parse(req.body);
    const result = await approveSalesQuote({ organizationId: req.user!.organizationId, userId: req.user!.id, quoteId: req.params.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "sales_quote", entityId: req.params.id, action: `ventas_cotizacion_${input.decision}`, after: result });
    return res.json(result);
  } catch (error) {
    return salesError(error, res, next);
  }
});

salesRouter.get("/orders", async (req, res, next) => {
  try {
    const orders = await prisma.salesOrder.findMany({ where: { organizationId: req.user!.organizationId }, include: { customer: true, quote: true, items: { include: { product: true } }, deliveries: true, responsible: true }, orderBy: { updatedAt: "desc" } });
    return res.json({ orders });
  } catch (error) {
    return next(error);
  }
});

salesRouter.post("/orders", async (req, res, next) => {
  try {
    const input = createSalesOrderSchema.parse(req.body);
    const order = await createSalesOrder({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "sales_order", entityId: order.id, action: "ventas_pedido_creado", after: order });
    return res.status(201).json({ order });
  } catch (error) {
    return salesError(error, res, next);
  }
});

salesRouter.post("/orders/:id/confirm", async (req, res, next) => {
  try {
    const input = confirmSalesOrderSchema.parse(req.body);
    const order = await confirmSalesOrder({ organizationId: req.user!.organizationId, orderId: req.params.id, acknowledgement: input.acknowledgement });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "sales_order", entityId: order.id, action: "ventas_pedido_confirmado", after: order });
    return res.json({ order });
  } catch (error) {
    return salesError(error, res, next);
  }
});

salesRouter.post("/availability", async (req, res, next) => {
  try {
    const input = createSalesOrderSchema.pick({ items: true }).parse(req.body);
    return res.json({ availability: await availabilityForOrder(req.user!.organizationId, input.items) });
  } catch (error) {
    return salesError(error, res, next);
  }
});

salesRouter.get("/deliveries", async (req, res, next) => {
  try {
    const deliveries = await prisma.salesDelivery.findMany({ where: { organizationId: req.user!.organizationId }, include: { order: true, responsible: true, evidenceDocument: true }, orderBy: { createdAt: "desc" } });
    return res.json({ deliveries });
  } catch (error) {
    return next(error);
  }
});

salesRouter.post("/deliveries", async (req, res, next) => {
  try {
    const input = createDeliverySchema.parse(req.body);
    const delivery = await createDelivery({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "sales_delivery", entityId: delivery.id, action: "ventas_entrega_preparada", after: delivery });
    return res.status(201).json({ delivery });
  } catch (error) {
    return salesError(error, res, next);
  }
});

salesRouter.get("/samples", async (req, res, next) => {
  try {
    const samples = await prisma.salesSample.findMany({ where: { organizationId: req.user!.organizationId }, include: { customer: true, product: true, responsible: true, evidenceDocument: true }, orderBy: { createdAt: "desc" } });
    return res.json({ samples });
  } catch (error) {
    return next(error);
  }
});
