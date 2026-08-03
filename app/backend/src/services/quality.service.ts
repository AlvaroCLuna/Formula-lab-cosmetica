import { prisma } from "../db.js";

type QualityPrefix = "QLT-SPC" | "QLT-SMP" | "QLT-INS" | "QLT-REL" | "QLT-DEV" | "QLT-NCF" | "QLT-CAP" | "QLT-DSP";

export async function nextQualityCode(prefix: QualityPrefix, organizationId: string) {
  const count = prefix === "QLT-SPC" ? await prisma.qualitySpecification.count({ where: { organizationId } })
    : prefix === "QLT-SMP" ? await prisma.qualitySamplingPlan.count({ where: { organizationId } })
      : prefix === "QLT-INS" ? await prisma.qualityInspection.count({ where: { organizationId } })
        : prefix === "QLT-REL" ? await prisma.qualityRelease.count({ where: { organizationId } })
          : prefix === "QLT-DEV" ? await prisma.qualityDeviation.count({ where: { organizationId } })
            : prefix === "QLT-NCF" ? await prisma.qualityNonConformity.count({ where: { organizationId } })
              : prefix === "QLT-CAP" ? await prisma.qualityCapaAction.count({ where: { organizationId } })
                : await prisma.qualityDisposition.count({ where: { organizationId } });
  return `${prefix}-${String(count + 1).padStart(6, "0")}`;
}

export async function qualityDashboard(organizationId: string) {
  const now = new Date();
  const [pendingLots, quarantineLots, rejectedLots, openDeviations, openNcfs, overdueCapas, releases, inspections] = await Promise.all([
    prisma.qualityInspection.count({ where: { organizationId, status: { in: ["pendiente", "en_inspeccion"] } } }),
    prisma.qualityInspection.count({ where: { organizationId, status: "en_cuarentena" } }),
    prisma.qualityInspection.count({ where: { organizationId, status: "rechazado" } }),
    prisma.qualityDeviation.count({ where: { organizationId, status: { not: "cerrada" } } }),
    prisma.qualityNonConformity.count({ where: { organizationId, status: { notIn: ["cerrada", "cancelada"] } } }),
    prisma.qualityCapaAction.count({ where: { organizationId, status: { not: "cerrada" }, targetDate: { lt: now } } }),
    prisma.qualityRelease.count({ where: { organizationId, decision: "liberar" } }),
    prisma.qualityInspection.count({ where: { organizationId } })
  ]);
  return { pendingLots, quarantineLots, rejectedLots, openDeviations, openNcfs, overdueCapas, supplierApprovals: releases, rejectionRate: inspections ? Math.round((rejectedLots / inspections) * 1000) / 10 : 0, recent: await recentQualityActivity(organizationId) };
}

export async function createInspection(input: any) {
  return prisma.qualityInspection.create({
    data: {
      organizationId: input.organizationId,
      permanentCode: await nextQualityCode("QLT-INS", input.organizationId),
      responsibleUserId: input.userId,
      status: input.initialResult === "rechazado" ? "rechazado" : input.initialResult === "cuarentena" ? "en_cuarentena" : "en_inspeccion",
      inspectedAt: new Date(),
      ...stripMeta(input)
    },
    include: qualityInspectionInclude
  });
}

export async function createRelease(input: any) {
  const spec = await prisma.qualitySpecification.findFirstOrThrow({ where: { id: input.specificationId, organizationId: input.organizationId } });
  if (spec.status !== "aprobada" || spec.locked === false) throw new Error("No se puede aprobar contra una especificacion no aprobada u obsoleta.");
  const hasResult = input.inspectionId ? await prisma.qualityInspection.findFirst({ where: { id: input.inspectionId, organizationId: input.organizationId, status: { in: ["aprobado", "aprobado_con_observaciones", "rechazado", "en_cuarentena", "en_inspeccion"] } } }) : true;
  if (!hasResult) throw new Error("No liberar sin resultados suficientes.");
  return prisma.qualityRelease.create({
    data: { organizationId: input.organizationId, permanentCode: await nextQualityCode("QLT-REL", input.organizationId), responsibleUserId: input.userId, closed: true, ...stripMeta(input) },
    include: { specification: true, inspection: true, evidenceDocument: true }
  });
}

export async function createDeviation(input: any) {
  if (!input.containment) throw new Error("Toda desviacion requiere contencion.");
  return prisma.qualityDeviation.create({ data: { organizationId: input.organizationId, permanentCode: await nextQualityCode("QLT-DEV", input.organizationId), responsibleUserId: input.userId, ...stripMeta(input) }, include: { evidenceDocument: true } });
}

export async function createNcf(input: any) {
  return prisma.qualityNonConformity.create({ data: { organizationId: input.organizationId, permanentCode: await nextQualityCode("QLT-NCF", input.organizationId), responsibleUserId: input.userId, ...stripMeta(input) }, include: { evidenceDocument: true } });
}

export async function createCapa(input: any) {
  return prisma.qualityCapaAction.create({ data: { organizationId: input.organizationId, permanentCode: await nextQualityCode("QLT-CAP", input.organizationId), responsibleUserId: input.userId, ...stripMeta(input) }, include: { deviation: true, nonConformity: true, evidenceDocument: true } });
}

export async function createDisposition(input: any) {
  const disposition = await prisma.qualityDisposition.create({ data: { organizationId: input.organizationId, permanentCode: await nextQualityCode("QLT-DSP", input.organizationId), responsibleUserId: input.userId, ...stripMeta(input) }, include: { nonConformity: true, evidenceDocument: true } });
  if (input.nonConformityId) await prisma.qualityNonConformity.update({ where: { id: input.nonConformityId }, data: { dispositionId: disposition.id, status: "cerrada" } });
  return disposition;
}

export const qualityInspectionInclude = { specification: true, evidenceDocument: true, responsible: true, releases: true };

export function assertNcfCloseable(status: string, dispositionId?: string | null) {
  if (status === "cerrada" && !dispositionId) throw new Error("Toda no conformidad cerrada debe tener disposicion.");
  return true;
}

function stripMeta(input: any) {
  const { organizationId, userId, ...data } = input;
  return data;
}

async function recentQualityActivity(organizationId: string) {
  const [inspections, releases, deviations] = await Promise.all([
    prisma.qualityInspection.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.qualityRelease.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.qualityDeviation.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 3 })
  ]);
  return [...inspections.map((item) => ({ type: "inspeccion", code: item.permanentCode, status: item.status })), ...releases.map((item) => ({ type: "liberacion", code: item.permanentCode, status: item.decision })), ...deviations.map((item) => ({ type: "desviacion", code: item.permanentCode, status: item.status }))].slice(0, 8);
}
