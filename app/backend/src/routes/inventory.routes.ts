import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { recordAudit } from "../services/audit.service.js";
import { applyInventoryMovement, chooseFefoLots, lotAlerts } from "../services/inventory.service.js";
import { calculateFormulaEngine } from "../services/formula-engine.service.js";
import { availabilitySchema, createLotSchema, listInventorySchema, movementSchema } from "../validators/inventory.schemas.js";

export const inventoryRouter = Router();
inventoryRouter.use(requireAuth);

inventoryRouter.get("/dashboard", async (req, res, next) => {
  try {
    const lots = await prisma.rawMaterialLot.findMany({ where: { organizationId: req.user!.organizationId }, include: { location: { include: { warehouse: true } }, rawMaterial: true } });
    const movements = await prisma.inventoryMovement.findMany({ where: { organizationId: req.user!.organizationId }, orderBy: { createdAt: "desc" }, take: 10, include: { lot: { include: { rawMaterial: true } } } });
    const value = lots.reduce((sum, lot) => sum + lot.availableQuantity * (lot.unitCost ?? 0), 0);
    return res.json({
      indicators: {
        estimatedValue: Math.round(value * 100) / 100,
        lowStock: lots.filter((lot) => lot.availableQuantity < 100).length,
        expiringSoon: lots.filter((lot) => lotAlerts(lot).some((alert) => alert.includes("proximo"))).length,
        quarantine: lots.filter((lot) => lot.status === "cuarentena").length,
        blocked: lots.filter((lot) => lot.status === "bloqueado").length
      },
      warehouseStock: lots.reduce<Record<string, number>>((acc, lot) => {
        const key = lot.location?.warehouse.name ?? "Sin ubicacion";
        acc[key] = (acc[key] ?? 0) + lot.availableQuantity;
        return acc;
      }, {}),
      movements
    });
  } catch (error) {
    return next(error);
  }
});

inventoryRouter.get("/lots", async (req, res, next) => {
  try {
    const query = listInventorySchema.parse(req.query);
    const lots = await prisma.rawMaterialLot.findMany({
      where: {
        organizationId: req.user!.organizationId,
        ...(query.status ? { status: query.status as never } : {}),
        ...(query.rawMaterialMasterId ? { rawMaterialMasterId: query.rawMaterialMasterId } : {}),
        ...(query.search ? { OR: [{ permanentCode: { contains: query.search } }, { lotCode: { contains: query.search } }, { supplierLotNumber: { contains: query.search } }] } : {})
      },
      orderBy: { expirationDate: "asc" },
      include: { rawMaterial: true, commercialProduct: true, supplier: true, location: { include: { warehouse: true } }, movements: { orderBy: { createdAt: "desc" }, take: 5 } }
    });
    return res.json({ lots: lots.map((lot) => ({ ...lot, alerts: lotAlerts(lot) })) });
  } catch (error) {
    return next(error);
  }
});

inventoryRouter.post("/lots", async (req, res, next) => {
  try {
    const input = createLotSchema.parse(req.body);
    const count = await prisma.rawMaterialLot.count({ where: { organizationId: req.user!.organizationId } });
    const lot = await prisma.rawMaterialLot.create({
      data: {
        organizationId: req.user!.organizationId,
        rawMaterialMasterId: input.rawMaterialMasterId,
        commercialProductId: input.commercialProductId,
        locationId: input.locationId,
        permanentCode: `LOT-${String(count + 1).padStart(5, "0")}`,
        lotCode: `LOT-${String(count + 1).padStart(5, "0")}`,
        supplierLotNumber: input.supplierLotNumber,
        expectedQuantity: input.expectedQuantity,
        receivedQuantity: input.receivedQuantity,
        availableQuantity: 0,
        unit: input.unit,
        expirationDate: input.expirationDate ? new Date(input.expirationDate) : null,
        unitCost: input.unitCost,
        currency: input.currency,
        observations: input.observations,
        status: "pendiente_recepcion"
      }
    });
    const applied = input.receivedQuantity > 0 ? await applyInventoryMovement({ organizationId: req.user!.organizationId, userId: req.user!.id, lotId: lot.id, type: "entrada", quantity: input.receivedQuantity, reason: "Recepcion inicial", reference: "recepcion_guiada" }) : { lot, movement: null };
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "raw_material_lot", entityId: lot.id, action: "lote_creado", after: applied });
    return res.status(201).json(applied);
  } catch (error) {
    return next(error);
  }
});

inventoryRouter.post("/lots/:id/movements", async (req, res, next) => {
  try {
    const input = movementSchema.parse(req.body);
    if (input.type === "transferencia") {
      if (!input.toLocationId) return res.status(409).json({ message: "Toda transferencia requiere ubicacion destino." });
      const lot = await prisma.rawMaterialLot.findFirstOrThrow({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
      const output = await applyInventoryMovement({
        organizationId: req.user!.organizationId,
        userId: req.user!.id,
        lotId: req.params.id,
        type: "salida",
        quantity: input.quantity,
        reason: input.reason,
        reference: input.reference ?? "transferencia",
        fromLocationId: lot.locationId,
        toLocationId: input.toLocationId
      });
      const incoming = await applyInventoryMovement({
        organizationId: req.user!.organizationId,
        userId: req.user!.id,
        lotId: req.params.id,
        type: "entrada",
        quantity: input.quantity,
        reason: input.reason,
        reference: input.reference ?? "transferencia",
        fromLocationId: lot.locationId,
        toLocationId: input.toLocationId,
        relatedMovementId: output.movement.id
      });
      await prisma.inventoryMovement.update({ where: { id: output.movement.id }, data: { relatedMovementId: incoming.movement.id } });
      const result = { lot: incoming.lot, movements: [output.movement, incoming.movement] };
      await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "inventory_movement", entityId: incoming.movement.id, action: "inventario_transferencia", after: result });
      return res.status(201).json(result);
    }
    const result = await applyInventoryMovement({ organizationId: req.user!.organizationId, userId: req.user!.id, lotId: req.params.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "inventory_movement", entityId: result.movement.id, action: `inventario_${input.type}`, after: result });
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error && /saldo negativo|No se puede|cantidad del movimiento|ajuste requiere/i.test(error.message)) {
      return res.status(409).json({ message: error.message });
    }
    return next(error);
  }
});

inventoryRouter.get("/lots/:id/kardex", async (req, res, next) => {
  try {
    const movements = await prisma.inventoryMovement.findMany({ where: { lotId: req.params.id, organizationId: req.user!.organizationId }, orderBy: { createdAt: "asc" }, include: { createdBy: true, document: true } });
    return res.json({ movements });
  } catch (error) {
    return next(error);
  }
});

inventoryRouter.get("/availability", async (req, res, next) => {
  try {
    const input = availabilitySchema.parse(req.query);
    const version = await prisma.formulationVersion.findFirstOrThrow({ where: { id: input.formulationVersionId, organizationId: req.user!.organizationId }, include: { ingredients: { where: { status: "activo" } } } });
    const formula = calculateFormulaEngine(version.ingredients, input.batchSize);
    const rows = await Promise.all(version.ingredients.map(async (ingredient) => {
      const required = formula.rows.find((row) => row.id === ingredient.id)?.grams ?? 0;
      const lots = ingredient.rawMaterialMasterId ? await prisma.rawMaterialLot.findMany({ where: { organizationId: req.user!.organizationId, rawMaterialMasterId: ingredient.rawMaterialMasterId }, orderBy: { expirationDate: "asc" } }) : [];
      const candidates = chooseFefoLots(lots, required);
      const available = lots.filter((lot) => !["rechazado", "bloqueado", "agotado", "caducado", "archivado"].includes(lot.status)).reduce((sum, lot) => sum + lot.availableQuantity, 0);
      return { ingredient: ingredient.displayName, required, available, missing: Math.max(required - available, 0), coveragePercent: required ? Math.min(100, Math.round((available / required) * 10000) / 100) : 100, candidates };
    }));
    return res.json({ batchSize: input.batchSize, rows });
  } catch (error) {
    return next(error);
  }
});

inventoryRouter.get("/warehouses", async (req, res, next) => {
  try {
    const warehouses = await prisma.inventoryWarehouse.findMany({ where: { organizationId: req.user!.organizationId }, include: { locations: true } });
    return res.json({ warehouses });
  } catch (error) {
    return next(error);
  }
});
