import { prisma } from "../db.js";
import { applyInventoryMovement } from "./inventory.service.js";

type PurchaseLine = {
  commercialProductId?: string | null;
  rawMaterialMasterId?: string | null;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  taxRate?: number;
  specifications?: string | null;
};

export function calculatePurchaseTotals(items: PurchaseLine[], shippingTotal = 0, discountTotal = 0) {
  if (!items.length) throw new Error("La orden de compra requiere al menos un renglon.");
  const subtotal = items.reduce((sum, item) => sum + item.quantity * (item.unitPrice ?? 0), 0);
  const taxTotal = items.reduce((sum, item) => sum + item.quantity * (item.unitPrice ?? 0) * ((item.taxRate ?? 0) / 100), 0);
  const total = subtotal + taxTotal + shippingTotal - discountTotal;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    shippingTotal: Math.round(shippingTotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}

export function assertReceiptQuantity(pending: number, received: number, authorizedReason?: string | null) {
  if (received <= 0) throw new Error("La cantidad recibida debe ser positiva.");
  if (received > pending && !authorizedReason?.trim()) {
    throw new Error("No se puede recibir mas que el saldo pendiente sin autorizacion documentada.");
  }
}

async function nextPurchaseCode(organizationId: string, prefix: string, model: "purchaseRequest" | "purchaseQuote" | "purchaseOrder" | "purchaseReceipt" | "purchaseReturn") {
  const count =
    model === "purchaseRequest" ? await prisma.purchaseRequest.count({ where: { organizationId } }) :
    model === "purchaseQuote" ? await prisma.purchaseQuote.count({ where: { organizationId } }) :
    model === "purchaseOrder" ? await prisma.purchaseOrder.count({ where: { organizationId } }) :
    model === "purchaseReceipt" ? await prisma.purchaseReceipt.count({ where: { organizationId } }) :
    await prisma.purchaseReturn.count({ where: { organizationId } });
  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
}

export async function purchaseDashboard(organizationId: string) {
  const [requests, quotes, orders, receipts, returnsList, evaluations, suggestions] = await Promise.all([
    prisma.purchaseRequest.findMany({ where: { organizationId }, include: { items: true }, orderBy: { updatedAt: "desc" }, take: 8 }),
    prisma.purchaseQuote.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.purchaseOrder.findMany({ where: { organizationId }, include: { items: true, receipts: true }, orderBy: { updatedAt: "desc" }, take: 8 }),
    prisma.purchaseReceipt.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.purchaseReturn.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.supplierEvaluation.findMany({ where: { organizationId }, orderBy: { evaluatedAt: "desc" }, take: 5 }),
    prisma.supplySuggestion.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 8 })
  ]);
  return {
    indicators: {
      openRequests: requests.filter((item) => !["cerrada", "cancelada", "rechazada"].includes(item.status)).length,
      pendingQuotes: quotes.filter((quote) => quote.validUntil && quote.validUntil < new Date()).length,
      ordersInApproval: orders.filter((order) => order.status === "pendiente_aprobacion").length,
      partialReceipts: orders.filter((order) => order.status === "parcialmente_recibida").length,
      supplierIncidents: evaluations.reduce((sum, item) => sum + item.incidents, 0),
      supplyAlerts: suggestions.length
    },
    requests,
    quotes,
    orders,
    receipts,
    returns: returnsList,
    evaluations,
    suggestions
  };
}

export async function createPurchaseRequest(input: {
  organizationId: string;
  userId: string;
  origin: string;
  area: string;
  priority: "baja" | "media" | "alta" | "urgente";
  requiredDate?: Date | null;
  reason: string;
  observations?: string | null;
  documentId?: string | null;
  items: PurchaseLine[];
}) {
  const code = await nextPurchaseCode(input.organizationId, "PUR-REQ", "purchaseRequest");
  return prisma.purchaseRequest.create({
    data: {
      organizationId: input.organizationId,
      permanentCode: code,
      origin: input.origin,
      area: input.area,
      priority: input.priority,
      requesterUserId: input.userId,
      requiredDate: input.requiredDate,
      reason: input.reason,
      observations: input.observations,
      documentId: input.documentId,
      status: "enviada",
      items: { create: input.items.map((item) => ({ organizationId: input.organizationId, rawMaterialMasterId: item.rawMaterialMasterId, commercialProductId: item.commercialProductId, itemName: item.itemName, quantity: item.quantity, unit: item.unit, specifications: item.specifications })) }
    },
    include: { items: true, requester: true, document: true }
  });
}

export async function createPurchaseQuote(input: {
  organizationId: string;
  userId: string;
  rfqId?: string | null;
  supplierId?: string | null;
  supplierName: string;
  commercialProductId?: string | null;
  manufacturerName?: string | null;
  presentation?: string | null;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  shippingCost?: number;
  currency: "MXN" | "USD";
  exchangeRate?: number | null;
  minimumPurchase?: number | null;
  validUntil?: Date | null;
  leadTimeDays?: number | null;
  paymentTerms?: string | null;
  availability?: string | null;
  documentId?: string | null;
  observations?: string | null;
}) {
  const code = await nextPurchaseCode(input.organizationId, "PUR-QUO", "purchaseQuote");
  const quote = await prisma.purchaseQuote.create({
    data: {
      organizationId: input.organizationId,
      permanentCode: code,
      rfqId: input.rfqId,
      supplierId: input.supplierId,
      supplierName: input.supplierName,
      commercialProductId: input.commercialProductId,
      manufacturerName: input.manufacturerName,
      presentation: input.presentation,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      taxRate: input.taxRate ?? 0,
      shippingCost: input.shippingCost ?? 0,
      currency: input.currency,
      exchangeRate: input.exchangeRate,
      minimumPurchase: input.minimumPurchase,
      validUntil: input.validUntil,
      leadTimeDays: input.leadTimeDays,
      paymentTerms: input.paymentTerms,
      availability: input.availability,
      documentId: input.documentId,
      observations: input.observations
    }
  });
  if (input.commercialProductId) {
    await prisma.rawMaterialPriceHistory.create({
      data: {
        organizationId: input.organizationId,
        commercialProductId: input.commercialProductId,
        supplierId: input.supplierId,
        previousPrice: input.unitPrice,
        newPrice: input.unitPrice,
        currency: input.currency,
        taxRate: input.taxRate ?? 0,
        shippingCost: input.shippingCost ?? 0,
        quotedAt: new Date(),
        createdByUserId: input.userId,
        reason: `Cotizacion ${code}`,
        evidenceReference: input.documentId,
        validUntil: input.validUntil
      }
    });
  }
  return quote;
}

export async function createPurchaseOrder(input: {
  organizationId: string;
  userId: string;
  supplierName: string;
  requisitionId?: string | null;
  quoteId?: string | null;
  currency: "MXN" | "USD";
  exchangeRate?: number | null;
  promisedDate?: Date | null;
  terms?: string | null;
  documentId?: string | null;
  items: PurchaseLine[];
}) {
  if (!input.supplierName.trim()) throw new Error("La orden de compra requiere proveedor.");
  const totals = calculatePurchaseTotals(input.items);
  const code = await nextPurchaseCode(input.organizationId, "PUR-PO", "purchaseOrder");
  return prisma.purchaseOrder.create({
    data: {
      organizationId: input.organizationId,
      permanentCode: code,
      supplierName: input.supplierName,
      requisitionId: input.requisitionId,
      quoteId: input.quoteId,
      currency: input.currency,
      exchangeRate: input.exchangeRate,
      promisedDate: input.promisedDate,
      terms: input.terms,
      documentId: input.documentId,
      responsibleUserId: input.userId,
      status: "pendiente_aprobacion",
      ...totals,
      items: {
        create: input.items.map((item) => ({
          organizationId: input.organizationId,
          commercialProductId: item.commercialProductId,
          rawMaterialMasterId: item.rawMaterialMasterId,
          itemName: item.itemName,
          quantityOrdered: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice ?? 0,
          taxRate: item.taxRate ?? 0,
          lineTotal: Math.round(item.quantity * (item.unitPrice ?? 0) * 100) / 100
        }))
      }
    },
    include: { items: true, quote: true, requisition: true, approvals: true, receipts: true }
  });
}

export async function approvePurchaseOrder(input: { organizationId: string; userId: string; orderId: string; decision: "aprobada" | "rechazada"; comment?: string | null; level: number; evidenceDocumentId?: string | null }) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.purchaseOrder.findFirstOrThrow({ where: { id: input.orderId, organizationId: input.organizationId } });
    const approval = await tx.purchaseApproval.create({ data: { organizationId: input.organizationId, orderId: order.id, approverUserId: input.userId, decision: input.decision, comment: input.comment, level: input.level, evidenceDocumentId: input.evidenceDocumentId } });
    const updated = await tx.purchaseOrder.update({ where: { id: order.id }, data: { status: input.decision === "aprobada" ? "aprobada" : "cancelada" }, include: { items: true, approvals: true } });
    return { order: updated, approval };
  });
}

export async function receivePurchase(input: {
  organizationId: string;
  userId: string;
  orderId: string;
  orderItemId?: string | null;
  expectedQuantity: number;
  receivedQuantity: number;
  supplierLotCode?: string | null;
  remision?: string | null;
  invoice?: string | null;
  packageStatus?: string | null;
  initialStatus: string;
  observations?: string | null;
  documentId?: string | null;
  inventoryLotId?: string | null;
  qualityInspectionId?: string | null;
  authorizedOverReceiptReason?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.purchaseOrder.findFirstOrThrow({ where: { id: input.orderId, organizationId: input.organizationId }, include: { items: true } });
    const item = input.orderItemId ? order.items.find((row) => row.id === input.orderItemId) : order.items[0];
    if (!item) throw new Error("La recepcion requiere un renglon de orden valido.");
    const pending = Number(item.quantityOrdered) - Number(item.quantityReceived);
    assertReceiptQuantity(pending, input.receivedQuantity, input.authorizedOverReceiptReason);
    const receiptCode = await nextPurchaseCode(input.organizationId, "PUR-RCV", "purchaseReceipt");
    const receipt = await tx.purchaseReceipt.create({
      data: {
        organizationId: input.organizationId,
        permanentCode: receiptCode,
        orderId: order.id,
        orderItemId: item.id,
        expectedQuantity: input.expectedQuantity,
        receivedQuantity: input.receivedQuantity,
        differenceQuantity: input.receivedQuantity - input.expectedQuantity,
        supplierLotCode: input.supplierLotCode,
        remision: input.remision,
        invoice: input.invoice,
        packageStatus: input.packageStatus,
        initialStatus: input.initialStatus,
        observations: input.observations,
        documentId: input.documentId,
        inventoryLotId: input.inventoryLotId,
        qualityInspectionId: input.qualityInspectionId,
        responsibleUserId: input.userId
      }
    });
    await tx.purchaseOrderItem.update({ where: { id: item.id }, data: { quantityReceived: Number(item.quantityReceived) + input.receivedQuantity } });
    const freshItems = await tx.purchaseOrderItem.findMany({ where: { orderId: order.id } });
    const fullyReceived = freshItems.every((row) => Number(row.quantityReceived) >= Number(row.quantityOrdered));
    await tx.purchaseOrder.update({ where: { id: order.id }, data: { status: fullyReceived ? "recibida" : "parcialmente_recibida" } });
    return receipt;
  }).then(async (receipt) => {
    if (!input.inventoryLotId) return { receipt, movement: null };
    const movement = await applyInventoryMovement({ organizationId: input.organizationId, userId: input.userId, lotId: input.inventoryLotId, type: "entrada", quantity: input.receivedQuantity, reason: `Recepcion de compra ${receipt.permanentCode}`, reference: receipt.permanentCode });
    const updatedReceipt = await prisma.purchaseReceipt.update({ where: { id: receipt.id }, data: { inventoryMovementId: movement.movement.id } });
    return { receipt: updatedReceipt, movement };
  });
}

export async function createPurchaseReturn(input: { organizationId: string; userId: string; orderId?: string | null; lotId: string; reason: string; quantity: number; unit: string; evidenceDocumentId?: string | null; disposition: string }) {
  const result = await applyInventoryMovement({ organizationId: input.organizationId, userId: input.userId, lotId: input.lotId, type: "devolucion", quantity: input.quantity, reason: input.reason, reference: "devolucion_proveedor" });
  const code = await nextPurchaseCode(input.organizationId, "PUR-RTN", "purchaseReturn");
  const returnRow = await prisma.purchaseReturn.create({
    data: { organizationId: input.organizationId, permanentCode: code, orderId: input.orderId, lotId: input.lotId, reason: input.reason, quantity: input.quantity, unit: input.unit, evidenceDocumentId: input.evidenceDocumentId, responsibleUserId: input.userId, disposition: input.disposition, inventoryMovementId: result.movement.id }
  });
  return { return: returnRow, movement: result.movement };
}
