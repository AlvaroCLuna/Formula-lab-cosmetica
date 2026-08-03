import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { recordAudit } from "../services/audit.service.js";
import { approvePurchaseOrder, createPurchaseOrder, createPurchaseQuote, createPurchaseRequest, createPurchaseReturn, purchaseDashboard, receivePurchase } from "../services/purchases.service.js";
import { approvePurchaseOrderSchema, createPurchaseOrderSchema, createPurchaseReceiptSchema, createPurchaseRequestSchema, createPurchaseReturnSchema, createQuoteSchema, purchaseListSchema } from "../validators/purchases.schemas.js";

export const purchasesRouter = Router();
purchasesRouter.use(requireAuth);

function purchaseError(error: unknown, res: import("express").Response, next: import("express").NextFunction) {
  if (error instanceof Error && /requiere|No se puede|saldo|proveedor|orden|recepcion|cantidad/i.test(error.message)) return res.status(409).json({ message: error.message });
  return next(error);
}

purchasesRouter.get("/dashboard", async (req, res, next) => {
  try {
    return res.json(await purchaseDashboard(req.user!.organizationId));
  } catch (error) {
    return next(error);
  }
});

purchasesRouter.get("/requests", async (req, res, next) => {
  try {
    const query = purchaseListSchema.parse(req.query);
    const requests = await prisma.purchaseRequest.findMany({
      where: { organizationId: req.user!.organizationId, ...(query.status ? { status: query.status as never } : {}), ...(query.search ? { OR: [{ permanentCode: { contains: query.search } }, { reason: { contains: query.search } }, { area: { contains: query.search } }] } : {}) },
      include: { items: true, requester: true, document: true },
      orderBy: { updatedAt: "desc" }
    });
    return res.json({ requests });
  } catch (error) {
    return next(error);
  }
});

purchasesRouter.post("/requests", async (req, res, next) => {
  try {
    const input = createPurchaseRequestSchema.parse(req.body);
    const request = await createPurchaseRequest({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "purchase_request", entityId: request.id, action: "compra_solicitud_creada", after: request });
    return res.status(201).json({ request });
  } catch (error) {
    return purchaseError(error, res, next);
  }
});

purchasesRouter.get("/requisitions", async (req, res, next) => {
  try {
    const requisitions = await prisma.purchaseRequisition.findMany({ where: { organizationId: req.user!.organizationId }, include: { items: true, responsible: true, rfqs: true, orders: true }, orderBy: { updatedAt: "desc" } });
    return res.json({ requisitions });
  } catch (error) {
    return next(error);
  }
});

purchasesRouter.get("/rfqs", async (req, res, next) => {
  try {
    const rfqs = await prisma.purchaseRfq.findMany({ where: { organizationId: req.user!.organizationId }, include: { requisition: true, quotes: true, document: true }, orderBy: { updatedAt: "desc" } });
    return res.json({ rfqs });
  } catch (error) {
    return next(error);
  }
});

purchasesRouter.get("/quotes", async (req, res, next) => {
  try {
    const quotes = await prisma.purchaseQuote.findMany({ where: { organizationId: req.user!.organizationId }, include: { rfq: true, comparisons: true, document: true }, orderBy: { createdAt: "desc" } });
    return res.json({ quotes });
  } catch (error) {
    return next(error);
  }
});

purchasesRouter.post("/quotes", async (req, res, next) => {
  try {
    const input = createQuoteSchema.parse(req.body);
    const quote = await createPurchaseQuote({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "purchase_quote", entityId: quote.id, action: "compra_cotizacion_registrada", after: quote });
    return res.status(201).json({ quote });
  } catch (error) {
    return purchaseError(error, res, next);
  }
});

purchasesRouter.get("/comparisons", async (req, res, next) => {
  try {
    const comparisons = await prisma.purchaseComparison.findMany({ where: { organizationId: req.user!.organizationId }, include: { quote: true }, orderBy: { createdAt: "desc" } });
    return res.json({ comparisons });
  } catch (error) {
    return next(error);
  }
});

purchasesRouter.get("/orders", async (req, res, next) => {
  try {
    const query = purchaseListSchema.parse(req.query);
    const orders = await prisma.purchaseOrder.findMany({
      where: { organizationId: req.user!.organizationId, ...(query.status ? { status: query.status as never } : {}), ...(query.search ? { OR: [{ permanentCode: { contains: query.search } }, { supplierName: { contains: query.search } }] } : {}) },
      include: { items: true, quote: true, approvals: true, receipts: true, returns: true, responsible: true },
      orderBy: { updatedAt: "desc" }
    });
    return res.json({ orders });
  } catch (error) {
    return next(error);
  }
});

purchasesRouter.post("/orders", async (req, res, next) => {
  try {
    const input = createPurchaseOrderSchema.parse(req.body);
    const order = await createPurchaseOrder({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "purchase_order", entityId: order.id, action: "compra_orden_creada", after: order });
    return res.status(201).json({ order });
  } catch (error) {
    return purchaseError(error, res, next);
  }
});

purchasesRouter.post("/orders/:id/approve", async (req, res, next) => {
  try {
    const input = approvePurchaseOrderSchema.parse(req.body);
    const result = await approvePurchaseOrder({ organizationId: req.user!.organizationId, userId: req.user!.id, orderId: req.params.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "purchase_order", entityId: req.params.id, action: `compra_orden_${input.decision}`, after: result });
    return res.json(result);
  } catch (error) {
    return purchaseError(error, res, next);
  }
});

purchasesRouter.get("/receipts", async (req, res, next) => {
  try {
    const receipts = await prisma.purchaseReceipt.findMany({ where: { organizationId: req.user!.organizationId }, include: { order: true, orderItem: true, responsible: true, document: true }, orderBy: { createdAt: "desc" } });
    return res.json({ receipts });
  } catch (error) {
    return next(error);
  }
});

purchasesRouter.post("/receipts", async (req, res, next) => {
  try {
    const input = createPurchaseReceiptSchema.parse(req.body);
    const result = await receivePurchase({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "purchase_receipt", entityId: result.receipt.id, action: "compra_recepcion_registrada", after: result });
    return res.status(201).json(result);
  } catch (error) {
    return purchaseError(error, res, next);
  }
});

purchasesRouter.get("/returns", async (req, res, next) => {
  try {
    const returns = await prisma.purchaseReturn.findMany({ where: { organizationId: req.user!.organizationId }, include: { order: true, responsible: true, evidenceDocument: true }, orderBy: { createdAt: "desc" } });
    return res.json({ returns });
  } catch (error) {
    return next(error);
  }
});

purchasesRouter.post("/returns", async (req, res, next) => {
  try {
    const input = createPurchaseReturnSchema.parse(req.body);
    const result = await createPurchaseReturn({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "purchase_return", entityId: result.return.id, action: "compra_devolucion_proveedor", after: result });
    return res.status(201).json(result);
  } catch (error) {
    return purchaseError(error, res, next);
  }
});

purchasesRouter.get("/supplier-evaluations", async (req, res, next) => {
  try {
    const evaluations = await prisma.supplierEvaluation.findMany({ where: { organizationId: req.user!.organizationId }, include: { responsible: true }, orderBy: { evaluatedAt: "desc" } });
    return res.json({ evaluations });
  } catch (error) {
    return next(error);
  }
});

purchasesRouter.get("/suggestions", async (req, res, next) => {
  try {
    const suggestions = await prisma.supplySuggestion.findMany({ where: { organizationId: req.user!.organizationId }, orderBy: { createdAt: "desc" } });
    return res.json({ suggestions });
  } catch (error) {
    return next(error);
  }
});
