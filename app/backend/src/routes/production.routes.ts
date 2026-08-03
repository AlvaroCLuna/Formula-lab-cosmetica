import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { recordAudit } from "../services/audit.service.js";
import { buildProductionAvailability, confirmConsumption, createProductionOrder, productionOrderInclude, transitionProductionOrder } from "../services/production.service.js";
import { confirmConsumptionSchema, createLogSchema, createProcessParameterSchema, createProductionOrderSchema, listProductionSchema, transitionProductionSchema, updateChecklistSchema } from "../validators/production.schemas.js";

export const productionRouter = Router();
productionRouter.use(requireAuth);

function businessError(error: unknown, res: import("express").Response, next: import("express").NextFunction) {
  if (error instanceof Error && /No se puede|Solo se puede|checklist|consumo|sustitucion|terminada|cancelada/i.test(error.message)) {
    return res.status(409).json({ message: error.message });
  }
  return next(error);
}

productionRouter.get("/dashboard", async (req, res, next) => {
  try {
    const orders = await prisma.productionOrder.findMany({ where: { organizationId: req.user!.organizationId }, include: { consumptions: true, finishedLot: true } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return res.json({
      indicators: {
        activeOrders: orders.filter((order) => ["planeada", "liberada", "en_proceso"].includes(order.status)).length,
        todayProduction: orders.filter((order) => order.finishedAt && order.finishedAt >= today).reduce((sum, order) => sum + (order.actualYield ?? 0), 0),
        finishedLots: orders.filter((order) => order.finishedLot).length,
        consumption: Math.round(orders.flatMap((order) => order.consumptions).reduce((sum, item) => sum + (item.usedQuantity ?? 0), 0) * 1000) / 1000,
        waste: Math.round(orders.flatMap((order) => order.consumptions).reduce((sum, item) => sum + item.wasteQuantity, 0) * 1000) / 1000,
        stoppedOrders: orders.filter((order) => order.status === "pausada").length
      }
    });
  } catch (error) {
    return next(error);
  }
});

productionRouter.get("/orders", async (req, res, next) => {
  try {
    const query = listProductionSchema.parse(req.query);
    const orders = await prisma.productionOrder.findMany({
      where: {
        organizationId: req.user!.organizationId,
        ...(query.status ? { status: query.status as never } : {}),
        ...(query.priority ? { priority: query.priority as never } : {}),
        ...(query.search ? { OR: [{ permanentCode: { contains: query.search } }, { targetLotCode: { contains: query.search } }] } : {})
      },
      orderBy: { updatedAt: "desc" },
      include: productionOrderInclude
    });
    return res.json({ orders });
  } catch (error) {
    return next(error);
  }
});

productionRouter.get("/orders/:id", async (req, res, next) => {
  try {
    const order = await prisma.productionOrder.findFirstOrThrow({ where: { id: req.params.id, organizationId: req.user!.organizationId }, include: productionOrderInclude });
    const theoretical = await buildProductionAvailability(order.id, req.user!.organizationId);
    return res.json({ order, theoretical });
  } catch (error) {
    return next(error);
  }
});

productionRouter.post("/orders", async (req, res, next) => {
  try {
    const input = createProductionOrderSchema.parse(req.body);
    const order = await createProductionOrder({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "production_order", entityId: order.id, action: "orden_produccion_creada", after: order });
    return res.status(201).json({ order });
  } catch (error) {
    return businessError(error, res, next);
  }
});

productionRouter.post("/orders/:id/transition", async (req, res, next) => {
  try {
    const input = transitionProductionSchema.parse(req.body);
    const before = await prisma.productionOrder.findFirstOrThrow({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    const order = await transitionProductionOrder(req.params.id, req.user!.organizationId, req.user!.id, input.action, input.actualYield, input.observations);
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "production_order", entityId: order.id, action: `produccion_${input.action}`, before, after: order });
    return res.json({ order });
  } catch (error) {
    return businessError(error, res, next);
  }
});

productionRouter.patch("/checklist/:id", async (req, res, next) => {
  try {
    const input = updateChecklistSchema.parse(req.body);
    const before = await prisma.productionChecklistItem.findFirstOrThrow({ where: { id: req.params.id, organizationId: req.user!.organizationId }, include: { order: true } });
    if (["terminada", "cancelada"].includes(before.order.status)) return res.status(409).json({ message: "No se puede editar checklist de una orden cerrada." });
    const item = await prisma.productionChecklistItem.update({ where: { id: before.id }, data: { completed: input.completed, completedAt: input.completed ? new Date() : null, completedByUserId: input.completed ? req.user!.id : null } });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "production_checklist_item", entityId: item.id, action: "checklist_produccion_actualizado", before, after: item });
    return res.json({ item });
  } catch (error) {
    return next(error);
  }
});

productionRouter.post("/consumptions/:id/confirm", async (req, res, next) => {
  try {
    const input = confirmConsumptionSchema.parse(req.body);
    const before = await prisma.productionConsumption.findFirstOrThrow({ where: { id: req.params.id, organizationId: req.user!.organizationId }, include: { order: true } });
    const consumption = await confirmConsumption(before.order, { organizationId: req.user!.organizationId, userId: req.user!.id, consumptionId: before.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "production_consumption", entityId: consumption.id, action: "consumo_real_confirmado", before, after: consumption });
    return res.json({ consumption });
  } catch (error) {
    return businessError(error, res, next);
  }
});

productionRouter.post("/orders/:id/logs", async (req, res, next) => {
  try {
    const input = createLogSchema.parse(req.body);
    const order = await prisma.productionOrder.findFirstOrThrow({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    if (["terminada", "cancelada"].includes(order.status)) return res.status(409).json({ message: "No se puede registrar bitacora en una orden cerrada." });
    const log = await prisma.productionLog.create({ data: { organizationId: req.user!.organizationId, productionOrderId: order.id, operatorUserId: req.user!.id, ...input } });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "production_log", entityId: log.id, action: "bitacora_produccion_creada", after: log });
    return res.status(201).json({ log });
  } catch (error) {
    return next(error);
  }
});

productionRouter.post("/orders/:id/parameters", async (req, res, next) => {
  try {
    const input = createProcessParameterSchema.parse(req.body);
    const order = await prisma.productionOrder.findFirstOrThrow({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    if (["terminada", "cancelada"].includes(order.status)) return res.status(409).json({ message: "No se puede registrar parametro en una orden cerrada." });
    const parameter = await prisma.productionProcessParameter.create({ data: { organizationId: req.user!.organizationId, productionOrderId: order.id, recordedByUserId: req.user!.id, ...input } });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "production_process_parameter", entityId: parameter.id, action: "parametro_proceso_creado", after: parameter });
    return res.status(201).json({ parameter });
  } catch (error) {
    return next(error);
  }
});
