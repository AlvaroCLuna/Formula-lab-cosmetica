import { prisma } from "../db.js";

type SalesLine = {
  productId: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountRate?: number;
  taxRate?: number;
};

export function calculateSalesTotals(items: SalesLine[], shippingTotal = 0) {
  if (!items.length) throw new Error("La cotizacion o pedido requiere partidas validas.");
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice * ((item.discountRate ?? 0) / 100), 0);
  const taxable = subtotal - discountTotal;
  const taxTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (1 - (item.discountRate ?? 0) / 100)) * ((item.taxRate ?? 0) / 100), 0);
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    shippingTotal: Math.round(shippingTotal * 100) / 100,
    total: Math.round((taxable + taxTotal + shippingTotal) * 100) / 100
  };
}

async function nextCode(organizationId: string, prefix: string, model: "crmLead" | "crmCustomer" | "crmContact" | "crmActivity" | "crmOpportunity" | "salesProduct" | "salesPriceList" | "salesQuote" | "salesOrder" | "salesDelivery" | "salesSample") {
  const count =
    model === "crmLead" ? await prisma.crmLead.count({ where: { organizationId } }) :
    model === "crmCustomer" ? await prisma.crmCustomer.count({ where: { organizationId } }) :
    model === "crmContact" ? await prisma.crmContact.count({ where: { organizationId } }) :
    model === "crmActivity" ? await prisma.crmActivity.count({ where: { organizationId } }) :
    model === "crmOpportunity" ? await prisma.crmOpportunity.count({ where: { organizationId } }) :
    model === "salesProduct" ? await prisma.salesProduct.count({ where: { organizationId } }) :
    model === "salesPriceList" ? await prisma.salesPriceList.count({ where: { organizationId } }) :
    model === "salesQuote" ? await prisma.salesQuote.count({ where: { organizationId } }) :
    model === "salesOrder" ? await prisma.salesOrder.count({ where: { organizationId } }) :
    model === "salesDelivery" ? await prisma.salesDelivery.count({ where: { organizationId } }) :
    await prisma.salesSample.count({ where: { organizationId } });
  return `${prefix}-${String(count + 1).padStart(6, "0")}`;
}

export async function salesDashboard(organizationId: string) {
  const [leads, opportunities, quotes, orders, products, activities] = await Promise.all([
    prisma.crmLead.findMany({ where: { organizationId }, orderBy: { updatedAt: "desc" }, take: 8 }),
    prisma.crmOpportunity.findMany({ where: { organizationId }, orderBy: { updatedAt: "desc" }, take: 12 }),
    prisma.salesQuote.findMany({ where: { organizationId }, include: { customer: true, items: { include: { product: true } } }, orderBy: { updatedAt: "desc" }, take: 8 }),
    prisma.salesOrder.findMany({ where: { organizationId }, include: { customer: true, items: { include: { product: true } } }, orderBy: { updatedAt: "desc" }, take: 8 }),
    prisma.salesProduct.findMany({ where: { organizationId }, orderBy: { updatedAt: "desc" }, take: 12 }),
    prisma.crmActivity.findMany({ where: { organizationId }, orderBy: { scheduledAt: "desc" }, take: 10 })
  ]);
  return {
    indicators: {
      newLeads: leads.filter((lead) => lead.status === "nuevo").length,
      activeOpportunities: opportunities.filter((opportunity) => !["ganada", "perdida", "pausada"].includes(opportunity.stage)).length,
      pipelineValue: opportunities.reduce((sum, item) => sum + Number(item.estimatedValue), 0),
      openQuotes: quotes.filter((quote) => ["borrador", "enviada", "vista", "en_negociacion"].includes(quote.status)).length,
      expiredQuotes: quotes.filter((quote) => quote.validUntil && quote.validUntil < new Date()).length,
      activeOrders: orders.filter((order) => !["entregado", "cancelado", "cerrado"].includes(order.status)).length,
      estimatedSales: orders.reduce((sum, item) => sum + Number(item.total), 0)
    },
    leads,
    opportunities,
    quotes,
    orders,
    products,
    activities
  };
}

export async function createLead(input: { organizationId: string; userId: string; commercialName: string; legalName?: string | null; personType: string; industry?: string | null; segment?: string | null; channel?: string | null; origin?: string | null; priority: "baja" | "media" | "alta" | "urgente"; city?: string | null; state?: string | null; country: string; website?: string | null; observations?: string | null; tagsJson?: string[] | null; documentId?: string | null }) {
  const code = await nextCode(input.organizationId, "CRM-LEAD", "crmLead");
  return prisma.crmLead.create({ data: { organizationId: input.organizationId, permanentCode: code, commercialName: input.commercialName, legalName: input.legalName, personType: input.personType, industry: input.industry, segment: input.segment, channel: input.channel, origin: input.origin, responsibleUserId: input.userId, priority: input.priority, city: input.city, state: input.state, country: input.country, website: input.website, observations: input.observations, tagsJson: input.tagsJson ?? undefined, documentId: input.documentId }, include: { contacts: true, document: true, responsible: true } });
}

export async function convertLeadToCustomer(input: { organizationId: string; leadId: string; customerType: string; commercialTerms?: string | null; currency: "MXN" | "USD"; addressesJson?: unknown }) {
  const lead = await prisma.crmLead.findFirstOrThrow({ where: { id: input.leadId, organizationId: input.organizationId }, include: { customer: true } });
  if (lead.customer) return lead.customer;
  const code = await nextCode(input.organizationId, "CRM-CLI", "crmCustomer");
  return prisma.$transaction(async (tx) => {
    const customer = await tx.crmCustomer.create({
      data: { organizationId: input.organizationId, permanentCode: code, leadId: lead.id, legalName: lead.legalName ?? lead.commercialName, commercialName: lead.commercialName, customerType: input.customerType, segment: lead.segment, commercialTerms: input.commercialTerms, currency: input.currency, addressesJson: input.addressesJson ?? [{ city: lead.city, state: lead.state, country: lead.country }], documentId: lead.documentId }
    });
    await tx.crmLead.update({ where: { id: lead.id }, data: { status: "convertido", convertedCustomerId: customer.id } });
    await tx.crmContact.updateMany({ where: { leadId: lead.id, organizationId: input.organizationId }, data: { customerId: customer.id } });
    return customer;
  });
}

export async function createOpportunity(input: { organizationId: string; userId: string; leadId?: string | null; customerId?: string | null; name: string; productsInterestJson?: unknown; estimatedQuantity?: number | null; estimatedValue: number; currency: "MXN" | "USD"; probability: number; estimatedCloseDate?: Date | null; competition?: string | null; need?: string | null; observations?: string | null }) {
  if (!input.leadId && !input.customerId) throw new Error("La oportunidad requiere prospecto o cliente.");
  const code = await nextCode(input.organizationId, "CRM-OPP", "crmOpportunity");
  return prisma.crmOpportunity.create({ data: { organizationId: input.organizationId, permanentCode: code, leadId: input.leadId, customerId: input.customerId, name: input.name, productsInterestJson: input.productsInterestJson as never, estimatedQuantity: input.estimatedQuantity, estimatedValue: input.estimatedValue, currency: input.currency, probability: input.probability, estimatedCloseDate: input.estimatedCloseDate, responsibleUserId: input.userId, competition: input.competition, need: input.need, observations: input.observations }, include: { customer: true, lead: true } });
}

async function assertProductsSellable(organizationId: string, items: SalesLine[]) {
  const products = await prisma.salesProduct.findMany({ where: { organizationId, id: { in: items.map((item) => item.productId) } } });
  if (products.length !== items.length) throw new Error("No se puede vender un producto inexistente.");
  const versionIds = products.map((product) => product.formulationVersionId).filter(Boolean) as string[];
  if (versionIds.length) {
    const approved = await prisma.formulationVersion.count({ where: { organizationId, id: { in: versionIds }, status: "aprobada" } });
    if (approved !== versionIds.length) throw new Error("No se puede vender producto ligado a formulacion no aprobada.");
  }
  return products;
}

export async function createSalesQuote(input: { organizationId: string; customerId: string; opportunityId?: string | null; contactId?: string | null; currency: "MXN" | "USD"; exchangeRate?: number | null; shippingTotal: number; validUntil?: Date | null; conditions?: string | null; estimatedDate?: Date | null; notes?: string | null; documentId?: string | null; items: SalesLine[] }) {
  await assertProductsSellable(input.organizationId, input.items);
  const totals = calculateSalesTotals(input.items, input.shippingTotal);
  const code = await nextCode(input.organizationId, "SAL-QUO", "salesQuote");
  return prisma.salesQuote.create({
    data: { organizationId: input.organizationId, permanentCode: code, customerId: input.customerId, opportunityId: input.opportunityId, contactId: input.contactId, currency: input.currency, exchangeRate: input.exchangeRate, ...totals, validUntil: input.validUntil, conditions: input.conditions, estimatedDate: input.estimatedDate, notes: input.notes, documentId: input.documentId, status: "borrador", items: { create: input.items.map((item) => ({ organizationId: input.organizationId, productId: item.productId, quantity: item.quantity, unit: item.unit, unitPrice: item.unitPrice, discountRate: item.discountRate ?? 0, taxRate: item.taxRate ?? 0, lineTotal: Math.round(item.quantity * item.unitPrice * (1 - (item.discountRate ?? 0) / 100) * 100) / 100 })) } },
    include: { customer: true, opportunity: true, items: { include: { product: true } }, approvals: true }
  });
}

export async function approveSalesQuote(input: { organizationId: string; userId: string; quoteId: string; approvalType: string; decision: "aprobada" | "rechazada"; comment?: string | null; reason: string; evidenceDocumentId?: string | null }) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.salesQuote.findFirstOrThrow({ where: { id: input.quoteId, organizationId: input.organizationId } });
    const approval = await tx.salesApproval.create({ data: { organizationId: input.organizationId, quoteId: quote.id, approvalType: input.approvalType, approverUserId: input.userId, decision: input.decision, comment: input.comment, reason: input.reason, evidenceDocumentId: input.evidenceDocumentId } });
    const updated = await tx.salesQuote.update({ where: { id: quote.id }, data: { status: input.decision === "aprobada" ? "enviada" : "rechazada" }, include: { items: true, approvals: true } });
    return { quote: updated, approval };
  });
}

export async function availabilityForOrder(organizationId: string, items: SalesLine[]) {
  const products = await assertProductsSellable(organizationId, items);
  return items.map((item) => {
    const product = products.find((row) => row.id === item.productId);
    const available = product?.availability === "disponible" ? item.quantity : 0;
    return { productId: item.productId, productName: product?.name ?? "Producto", requested: item.quantity, available, missing: Math.max(item.quantity - available, 0), productionRequired: item.quantity > available, risks: item.quantity > available ? ["Requiere produccion o validacion de inventario terminado."] : [] };
  });
}

export async function createSalesOrder(input: { organizationId: string; userId: string; quoteId?: string | null; customerId: string; requestedDate?: Date | null; promisedDate?: Date | null; deliveryAddressJson?: unknown; observations?: string | null; documentId?: string | null; items: SalesLine[] }) {
  if (input.quoteId) {
    const quote = await prisma.salesQuote.findFirstOrThrow({ where: { id: input.quoteId, organizationId: input.organizationId }, include: { items: true } });
    if (!["aceptada", "enviada"].includes(quote.status)) throw new Error("Solo una cotizacion aceptada o enviada puede convertirse en pedido.");
  }
  const availability = await availabilityForOrder(input.organizationId, input.items);
  const totals = calculateSalesTotals(input.items);
  const code = await nextCode(input.organizationId, "SAL-ORD", "salesOrder");
  const productionSuggestion = availability.filter((row) => row.productionRequired);
  return prisma.$transaction(async (tx) => {
    const order = await tx.salesOrder.create({
      data: { organizationId: input.organizationId, permanentCode: code, customerId: input.customerId, quoteId: input.quoteId, currency: "MXN", ...totals, requestedDate: input.requestedDate, promisedDate: input.promisedDate, deliveryAddressJson: input.deliveryAddressJson as never, responsibleUserId: input.userId, status: "borrador", availabilitySnapshotJson: availability as never, productionSuggestionJson: productionSuggestion as never, observations: input.observations, documentId: input.documentId, items: { create: input.items.map((item) => ({ organizationId: input.organizationId, productId: item.productId, quantity: item.quantity, unit: item.unit, unitPrice: item.unitPrice, discountRate: item.discountRate ?? 0, lineTotal: Math.round(item.quantity * item.unitPrice * (1 - (item.discountRate ?? 0) / 100) * 100) / 100 })) } },
      include: { customer: true, items: { include: { product: true } } }
    });
    if (input.quoteId) await tx.salesQuote.update({ where: { id: input.quoteId }, data: { status: "convertida", convertedOrderId: order.id } });
    return order;
  });
}

export async function confirmSalesOrder(input: { organizationId: string; orderId: string; acknowledgement: string }) {
  const order = await prisma.salesOrder.findFirstOrThrow({ where: { id: input.orderId, organizationId: input.organizationId }, include: { items: true } });
  if (!order.items.length) throw new Error("No se puede confirmar pedido con partidas invalidas.");
  return prisma.salesOrder.update({ where: { id: order.id }, data: { status: "confirmado" }, include: { items: true, customer: true } });
}

export async function createDelivery(input: { organizationId: string; userId: string; orderId: string; itemsJson: Array<{ orderItemId: string; quantity: number; lotId?: string | null; qualityStatus?: string | null }>; lotIdsJson?: string[] | null; deliveredAt?: Date | null; addressJson?: unknown; carrierPrepared?: string | null; evidenceDocumentId?: string | null; status: string }) {
  if (input.itemsJson.some((item) => ["cuarentena", "bloqueado", "rechazado", "no_liberado"].includes(item.qualityStatus ?? ""))) throw new Error("No se puede entregar lote no liberado por calidad.");
  const code = await nextCode(input.organizationId, "SAL-DLV", "salesDelivery");
  return prisma.salesDelivery.create({ data: { organizationId: input.organizationId, permanentCode: code, orderId: input.orderId, itemsJson: input.itemsJson as never, lotIdsJson: input.lotIdsJson as never, deliveredAt: input.deliveredAt, addressJson: input.addressJson as never, responsibleUserId: input.userId, carrierPrepared: input.carrierPrepared, evidenceDocumentId: input.evidenceDocumentId, status: input.status }, include: { order: true, responsible: true } });
}
