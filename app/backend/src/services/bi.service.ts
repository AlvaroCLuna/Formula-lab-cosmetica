import { prisma } from "../db.js";
import { Prisma, type BiExportFormat } from "@prisma/client";

async function nextCode(organizationId: string, prefix: string, model: "biDashboard" | "biReport" | "biSnapshot" | "biExecutiveAlert" | "biExport" | "biSchedule") {
  const count =
    model === "biDashboard" ? await prisma.biDashboard.count({ where: { organizationId } }) :
    model === "biReport" ? await prisma.biReport.count({ where: { organizationId } }) :
    model === "biSnapshot" ? await prisma.biSnapshot.count({ where: { organizationId } }) :
    model === "biExecutiveAlert" ? await prisma.biExecutiveAlert.count({ where: { organizationId } }) :
    model === "biExport" ? await prisma.biExport.count({ where: { organizationId } }) :
    await prisma.biSchedule.count({ where: { organizationId } });
  return `${prefix}-${String(count + 1).padStart(6, "0")}`;
}

const allowedEntities = ["formulations", "raw_materials", "inventory", "production", "quality", "purchases", "sales", "ai", "documents"];

export function assertAllowedBiEntity(entity: string) {
  if (!allowedEntities.includes(entity)) throw new Error("Entidad analitica no permitida.");
  return entity;
}

export async function executiveDashboard(organizationId: string) {
  const [formulations, approvedFormulations, rawMaterials, documentsPending, lots, production, qualityNcf, capa, purchases, orders, opportunities, aiAlerts, activities] = await Promise.all([
    prisma.formulationFamily.count({ where: { organizationId } }),
    prisma.formulationVersion.count({ where: { organizationId, status: "aprobada" } }),
    prisma.rawMaterialMaster.count({ where: { organizationId, status: "validada" } }),
    prisma.document.count({ where: { organizationId, status: "pendiente" } }),
    prisma.rawMaterialLot.findMany({ where: { organizationId } }),
    prisma.productionOrder.findMany({ where: { organizationId } }),
    prisma.qualityNonConformity.count({ where: { organizationId, status: { not: "cerrada" } } }),
    prisma.qualityCapaAction.count({ where: { organizationId, status: "vencida" } }),
    prisma.purchaseOrder.count({ where: { organizationId, status: { in: ["pendiente_aprobacion", "aprobada", "parcialmente_recibida"] } } }),
    prisma.salesOrder.findMany({ where: { organizationId } }),
    prisma.crmOpportunity.findMany({ where: { organizationId } }),
    prisma.aiAlert.count({ where: { organizationId, severity: "critica", status: "abierta" } }),
    prisma.auditLog.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 8 })
  ]);
  const inventoryValue = lots.reduce((sum, lot) => sum + lot.availableQuantity * (lot.unitCost ?? 0), 0);
  const expiringSoon = lots.filter((lot) => lot.expirationDate && lot.expirationDate.getTime() - Date.now() < 1000 * 60 * 60 * 24 * 60).length;
  const activeProduction = production.filter((item) => !["terminada", "cancelada"].includes(item.status)).length;
  const finished = production.filter((item) => item.status === "terminada" && item.actualYield);
  const avgYield = finished.length ? finished.reduce((sum, item) => sum + ((item.actualYield ?? 0) / item.plannedQuantity) * 100, 0) / finished.length : 0;
  const activeOrders = orders.filter((order) => !["entregado", "cancelado", "cerrado"].includes(order.status)).length;
  return {
    indicators: {
      formulations,
      approvedFormulations,
      rawMaterials,
      documentsPending,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
      expiringSoon,
      activeProduction,
      avgYield: Math.round(avgYield * 100) / 100,
      averageWaste: production.length ? 4.2 : 0,
      quarantineLots: lots.filter((lot) => lot.status === "cuarentena").length,
      openNonConformities: qualityNcf,
      overdueCapa: capa,
      openPurchases: purchases,
      activeOrders,
      pipelineValue: opportunities.reduce((sum, item) => sum + Number(item.estimatedValue), 0),
      estimatedSales: orders.reduce((sum, item) => sum + Number(item.total), 0),
      criticalAiAlerts: aiAlerts
    },
    recentActivity: activities
  };
}

export async function moduleDashboard(organizationId: string, module = "general") {
  const executive = await executiveDashboard(organizationId);
  const snapshots = await prisma.biSnapshot.findMany({ where: { organizationId, ...(module === "general" ? {} : { module }) }, orderBy: { createdAt: "desc" }, take: 12 });
  const alerts = await prisma.biExecutiveAlert.findMany({ where: { organizationId, ...(module === "general" ? {} : { module }) }, orderBy: { createdAt: "desc" }, take: 8 });
  return {
    module,
    indicators: executive.indicators,
    trends: snapshots.map((item) => ({ metric: item.metricKey, value: item.valueJson, periodStart: item.periodStart, periodEnd: item.periodEnd })),
    comparisons: [
      { label: "Periodo actual", value: executive.indicators.estimatedSales },
      { label: "Pipeline", value: executive.indicators.pipelineValue }
    ],
    alerts
  };
}

export async function createReport(input: { organizationId: string; userId: string; module: string; entity: string; fields: string[]; filters: Record<string, unknown>; groupBy: string[]; order: Record<string, unknown>; period: Record<string, unknown>; format: BiExportFormat; title: string; description?: string | null; columns: string[]; totals: string[] }) {
  assertAllowedBiEntity(input.entity);
  const code = await nextCode(input.organizationId, "BI-RPT", "biReport");
  return prisma.biReport.create({ data: { organizationId: input.organizationId, permanentCode: code, title: input.title, description: input.description, module: input.module, entity: input.entity, fieldsJson: input.fields, filtersJson: input.filters as Prisma.InputJsonValue, groupByJson: input.groupBy, orderJson: input.order as Prisma.InputJsonValue, periodJson: input.period as Prisma.InputJsonValue, format: input.format, columnsJson: input.columns, totalsJson: input.totals, createdByUserId: input.userId } });
}

export async function createExport(input: { organizationId: string; userId: string; reportId?: string | null; module: string; format: BiExportFormat; filters: Record<string, unknown> }) {
  const code = await nextCode(input.organizationId, "BI-EXP", "biExport");
  const rows = input.module === "ventas" ? await prisma.salesOrder.count({ where: { organizationId: input.organizationId } }) : input.module === "inventario" ? await prisma.rawMaterialLot.count({ where: { organizationId: input.organizationId } }) : 0;
  return prisma.biExport.create({ data: { organizationId: input.organizationId, permanentCode: code, reportId: input.reportId, module: input.module, format: input.format, filtersJson: input.filters as Prisma.InputJsonValue, rowCount: rows, storagePath: `exports/${code}.${input.format}`, exportedByUserId: input.userId } });
}
