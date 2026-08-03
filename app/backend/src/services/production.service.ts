import type { FormulationIngredient, ProductionOrder } from "@prisma/client";
import { prisma } from "../db.js";
import { calculateFormulaEngine } from "./formula-engine.service.js";
import { applyInventoryMovement, chooseFefoLots } from "./inventory.service.js";

export const defaultChecklist = [
  "Equipo limpio",
  "Materia prima liberada",
  "Basculas calibradas",
  "EPP colocado",
  "Documentacion disponible"
];

export function assertProductionEditable(order: { status: string }) {
  if (order.status === "terminada") throw new Error("No se puede editar una orden terminada.");
  if (order.status === "cancelada") throw new Error("No se puede editar una orden cancelada.");
}

export async function generateProductionCode(organizationId: string) {
  const count = await prisma.productionOrder.count({ where: { organizationId } });
  return `OP-${String(count + 1).padStart(5, "0")}`;
}

export function calculateTheoreticalConsumption(ingredients: FormulationIngredient[], batchSize: number) {
  return calculateFormulaEngine(ingredients, batchSize).rows
    .filter((row) => row.rawMaterialMasterId)
    .map((row) => ({
      formulationIngredientId: row.id,
      rawMaterialMasterId: row.rawMaterialMasterId!,
      displayName: row.displayName,
      phase: row.phase,
      requiredQuantity: row.grams,
      unit: "g"
    }));
}

export async function buildProductionAvailability(orderId: string, organizationId: string) {
  const order = await prisma.productionOrder.findFirstOrThrow({
    where: { id: orderId, organizationId },
    include: {
      formulationVersion: { include: { ingredients: { where: { status: "activo" }, include: { rawMaterialMaster: { include: { products: true } } } }, family: true } },
      consumptions: true
    }
  });
  const rows = await Promise.all(calculateTheoreticalConsumption(order.formulationVersion.ingredients, order.plannedQuantity).map(async (item) => {
    const lots = await prisma.rawMaterialLot.findMany({
      where: { organizationId, rawMaterialMasterId: item.rawMaterialMasterId },
      orderBy: { expirationDate: "asc" }
    });
    const candidates = chooseFefoLots(lots, item.requiredQuantity);
    const available = lots.filter((lot) => !["rechazado", "bloqueado", "agotado", "caducado", "archivado"].includes(lot.status)).reduce((sum, lot) => sum + lot.availableQuantity, 0);
    const product = order.formulationVersion.ingredients.find((ingredient) => ingredient.id === item.formulationIngredientId)?.rawMaterialMaster?.products?.find((candidate) => candidate.status === "activo");
    const unitCost = product?.averageCost ?? product?.price ?? null;
    return {
      ...item,
      available,
      missing: Math.max(item.requiredQuantity - available, 0),
      coveragePercent: item.requiredQuantity ? Math.min(100, Math.round((available / item.requiredQuantity) * 10000) / 100) : 100,
      expectedCost: unitCost == null ? null : Math.round(unitCost * item.requiredQuantity * 10000) / 10000,
      suggestedLots: candidates
    };
  }));
  return { order, rows, expectedCost: Math.round(rows.reduce((sum, row) => sum + (row.expectedCost ?? 0), 0) * 10000) / 10000 };
}

export async function createProductionOrder(input: {
  organizationId: string;
  userId: string;
  formulationVersionId: string;
  targetLotCode?: string;
  plannedQuantity: number;
  plannedUnit: string;
  expectedYield?: number;
  priority: "baja" | "media" | "alta" | "urgente";
  responsibleUserId?: string | null;
  operatorUserId?: string | null;
  plannedStartAt?: string | null;
  plannedEndAt?: string | null;
  notes?: string | null;
}) {
  const version = await prisma.formulationVersion.findFirstOrThrow({
    where: { id: input.formulationVersionId, organizationId: input.organizationId },
    include: { ingredients: { where: { status: "activo" } } }
  });
  if (version.status !== "aprobada") throw new Error("Solo se puede fabricar una version de formulacion aprobada.");
  const permanentCode = await generateProductionCode(input.organizationId);
  const order = await prisma.productionOrder.create({
    data: {
      organizationId: input.organizationId,
      permanentCode,
      formulationVersionId: version.id,
      status: "borrador",
      priority: input.priority,
      targetLotCode: input.targetLotCode ?? `PT-${permanentCode}`,
      plannedQuantity: input.plannedQuantity,
      plannedUnit: input.plannedUnit,
      expectedYield: input.expectedYield ?? input.plannedQuantity,
      responsibleUserId: input.responsibleUserId ?? input.userId,
      operatorUserId: input.operatorUserId ?? input.userId,
      plannedStartAt: input.plannedStartAt ? new Date(input.plannedStartAt) : null,
      plannedEndAt: input.plannedEndAt ? new Date(input.plannedEndAt) : null,
      notes: input.notes,
      checklistItems: { create: defaultChecklist.map((label) => ({ organizationId: input.organizationId, label, required: true })) },
      consumptions: {
        create: calculateTheoreticalConsumption(version.ingredients, input.plannedQuantity).map((item) => ({
          organizationId: input.organizationId,
          rawMaterialMasterId: item.rawMaterialMasterId,
          formulationIngredientId: item.formulationIngredientId,
          requiredQuantity: item.requiredQuantity,
          unit: item.unit
        }))
      }
    },
    include: { checklistItems: true, consumptions: true, formulationVersion: true }
  });
  const availability = await buildProductionAvailability(order.id, input.organizationId);
  await prisma.productionOrder.update({ where: { id: order.id }, data: { expectedCost: availability.expectedCost } });
  return prisma.productionOrder.findFirstOrThrow({ where: { id: order.id }, include: productionOrderInclude });
}

export const productionOrderInclude = {
  formulationVersion: { include: { family: true, ingredients: true } },
  operator: true,
  responsible: true,
  checklistItems: true,
  consumptions: { include: { rawMaterial: true, lot: true } },
  logs: { orderBy: { createdAt: "asc" } },
  processParameters: { orderBy: { createdAt: "desc" } },
  finishedLot: true
} as const;

export async function confirmConsumption(order: ProductionOrder, input: {
  organizationId: string;
  userId: string;
  consumptionId: string;
  rawMaterialLotId: string;
  usedQuantity: number;
  wasteQuantity: number;
  substitutionAuthorized: boolean;
  observations?: string | null;
}) {
  assertProductionEditable(order);
  const consumption = await prisma.productionConsumption.findFirstOrThrow({ where: { id: input.consumptionId, organizationId: input.organizationId, productionOrderId: order.id } });
  if (consumption.confirmedAt) throw new Error("Este consumo ya fue confirmado.");
  const lot = await prisma.rawMaterialLot.findFirstOrThrow({ where: { id: input.rawMaterialLotId, organizationId: input.organizationId } });
  if (lot.rawMaterialMasterId !== consumption.rawMaterialMasterId && !input.substitutionAuthorized) throw new Error("La sustitucion requiere autorizacion explicita.");
  const total = input.usedQuantity + input.wasteQuantity;
  if (total > lot.availableQuantity) throw new Error("No se puede consumir mas inventario del disponible.");
  const movement = await applyInventoryMovement({
    organizationId: input.organizationId,
    userId: input.userId,
    lotId: lot.id,
    type: "salida",
    quantity: total,
    reason: `Consumo produccion ${order.permanentCode}`,
    reference: order.permanentCode
  });
  return prisma.productionConsumption.update({
    where: { id: consumption.id },
    data: {
      rawMaterialLotId: lot.id,
      usedQuantity: input.usedQuantity,
      wasteQuantity: input.wasteQuantity,
      substitutionAuthorized: input.substitutionAuthorized,
      observations: input.observations,
      confirmedAt: new Date(),
      confirmedByUserId: input.userId,
      inventoryMovementId: movement.movement.id
    },
    include: { rawMaterial: true, lot: true }
  });
}

export async function transitionProductionOrder(orderId: string, organizationId: string, userId: string, action: string, actualYield?: number, observations?: string | null) {
  const order = await prisma.productionOrder.findFirstOrThrow({ where: { id: orderId, organizationId }, include: { checklistItems: true, consumptions: true } });
  assertProductionEditable(order);
  const updates: Partial<ProductionOrder> = {};
  let logType: "inicio" | "fin" | "pausa" | "reanudacion" | "observacion" = "observacion";
  if (action === "planear") updates.status = "planeada";
  if (action === "liberar") updates.status = "liberada";
  if (action === "iniciar") {
    if (order.checklistItems.some((item) => item.required && !item.completed)) throw new Error("No se puede iniciar produccion con checklist obligatorio pendiente.");
    updates.status = "en_proceso";
    updates.startedAt = order.startedAt ?? new Date();
    logType = "inicio";
  }
  if (action === "pausar") {
    updates.status = "pausada";
    logType = "pausa";
  }
  if (action === "reanudar") {
    updates.status = "en_proceso";
    logType = "reanudacion";
  }
  if (action === "cancelar") updates.status = "cancelada";
  if (action === "terminar") {
    if (!order.consumptions.some((consumption) => consumption.confirmedAt)) throw new Error("No se puede cerrar una orden sin consumo registrado.");
    const yieldValue = actualYield ?? order.expectedYield;
    updates.status = "terminada";
    updates.finishedAt = new Date();
    updates.actualYield = yieldValue;
    updates.yieldDifference = Math.round((yieldValue - order.expectedYield) * 1000) / 1000;
    updates.wasteTotal = Math.round(order.consumptions.reduce((sum, item) => sum + item.wasteQuantity, 0) * 1000) / 1000;
    logType = "fin";
  }
  const updated = await prisma.productionOrder.update({ where: { id: order.id }, data: updates, include: productionOrderInclude });
  await prisma.productionLog.create({ data: { organizationId, productionOrderId: order.id, type: logType, operatorUserId: userId, observations } });
  if (action === "terminar" && !updated.finishedLot) {
    await prisma.finishedProductLot.create({
      data: {
        organizationId,
        productionOrderId: order.id,
        lotCode: order.targetLotCode,
        producedAt: new Date(),
        responsibleUserId: userId,
        quantityObtained: updated.actualYield ?? updated.expectedYield,
        unit: order.plannedUnit,
        expectedYield: order.expectedYield,
        actualYield: updated.actualYield ?? updated.expectedYield
      }
    });
  }
  return prisma.productionOrder.findFirstOrThrow({ where: { id: order.id }, include: productionOrderInclude });
}
