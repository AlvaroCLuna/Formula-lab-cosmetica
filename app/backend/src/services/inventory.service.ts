import { prisma } from "../db.js";
import type { InventoryMovementType, RawMaterialLot } from "@prisma/client";

const blockedStatuses = ["rechazado", "bloqueado", "agotado", "caducado", "archivado"];

export function canSuggestLot(lot: { status: string; availableQuantity: number; expirationDate: Date | null }) {
  if (blockedStatuses.includes(lot.status)) return false;
  if (lot.availableQuantity <= 0) return false;
  if (lot.expirationDate && lot.expirationDate < new Date()) return false;
  return true;
}

export function lotAlerts(lot: { status: string; expirationDate: Date | null; availableQuantity: number }) {
  const alerts: string[] = [];
  if (!lot.expirationDate) alerts.push("Lote sin fecha de caducidad.");
  if (lot.expirationDate && lot.expirationDate < new Date()) alerts.push("Lote caducado.");
  if (lot.expirationDate && lot.expirationDate >= new Date() && lot.expirationDate.getTime() - Date.now() < 1000 * 60 * 60 * 24 * 60) alerts.push("Lote proximo a caducar.");
  if (lot.status === "cuarentena") alerts.push("Lote en cuarentena.");
  if (lot.status === "bloqueado") alerts.push("Lote bloqueado.");
  if (lot.availableQuantity <= 0) alerts.push("Stock insuficiente.");
  return alerts;
}

export async function applyInventoryMovement(input: {
  organizationId: string;
  userId: string;
  lotId: string;
  type: InventoryMovementType;
  quantity: number;
  reason: string;
  reference?: string | null;
  toLocationId?: string | null;
  fromLocationId?: string | null;
  relatedMovementId?: string | null;
}) {
  if (input.quantity <= 0) throw new Error("La cantidad del movimiento debe ser positiva.");
  if (["ajuste_positivo", "ajuste_negativo"].includes(input.type) && !input.reason.trim()) throw new Error("Todo ajuste requiere motivo.");
  return prisma.$transaction(async (tx) => {
    const lot = await tx.rawMaterialLot.findFirstOrThrow({ where: { id: input.lotId, organizationId: input.organizationId } });
    const previousBalance = lot.availableQuantity;
    const previousReserved = lot.reservedQuantity;
    let nextBalance = previousBalance;
    let nextReserved = previousReserved;
    if (["entrada", "ajuste_positivo", "devolucion"].includes(input.type)) nextBalance += input.quantity;
    if (["salida", "ajuste_negativo", "rechazo", "merma"].includes(input.type)) nextBalance -= input.quantity;
    if (input.type === "reserva") {
      if (input.quantity > previousBalance) throw new Error("No se puede reservar mas que la existencia disponible.");
      nextBalance -= input.quantity;
      nextReserved += input.quantity;
    }
    if (input.type === "liberacion_reserva") {
      if (input.quantity > previousReserved) throw new Error("No se puede liberar mas reserva que la existente.");
      nextBalance += input.quantity;
      nextReserved -= input.quantity;
    }
    if (nextBalance < 0 || nextReserved < 0) throw new Error("El movimiento generaria saldo negativo.");
    const status = nextBalance === 0 && nextReserved === 0 ? "agotado" : lot.status;
    const updated = await tx.rawMaterialLot.update({
      where: { id: lot.id },
      data: { availableQuantity: nextBalance, reservedQuantity: nextReserved, status, locationId: input.toLocationId ?? lot.locationId }
    });
    const movement = await tx.inventoryMovement.create({
      data: {
        organizationId: input.organizationId,
        lotId: lot.id,
        type: input.type,
        quantity: input.quantity,
        unit: lot.unit,
        previousBalance,
        newBalance: nextBalance,
        previousReserved,
        newReserved: nextReserved,
        reason: input.reason,
        reference: input.reference,
        relatedMovementId: input.relatedMovementId,
        fromLocationId: input.fromLocationId,
        toLocationId: input.toLocationId,
        unitCost: lot.unitCost,
        currency: lot.currency,
        exchangeRate: lot.exchangeRate,
        createdByUserId: input.userId
      }
    });
    return { lot: updated, movement };
  });
}

export function chooseFefoLots(lots: RawMaterialLot[], requiredQuantity: number) {
  let remaining = requiredQuantity;
  return lots
    .filter(canSuggestLot)
    .sort((a, b) => (a.expirationDate?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.expirationDate?.getTime() ?? Number.MAX_SAFE_INTEGER))
    .map((lot) => {
      const quantity = Math.min(lot.availableQuantity, remaining);
      remaining -= quantity;
      return { lot, suggestedQuantity: quantity };
    })
    .filter((item) => item.suggestedQuantity > 0);
}
