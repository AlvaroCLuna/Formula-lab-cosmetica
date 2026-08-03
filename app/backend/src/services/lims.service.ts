import { prisma } from "../db.js";

type LabPrefix = "LAB-PRJ" | "LAB-SMP" | "LAB-TST" | "LAB-MTH" | "LAB-INS" | "LAB-STB" | "LAB-NCF";

export async function nextLabCode(prefix: LabPrefix, organizationId: string) {
  const count = prefix === "LAB-PRJ" ? await prisma.labProject.count({ where: { organizationId } })
    : prefix === "LAB-SMP" ? await prisma.labSample.count({ where: { organizationId } })
      : prefix === "LAB-TST" ? await prisma.labTest.count({ where: { organizationId } })
        : prefix === "LAB-MTH" ? await prisma.labTestMethod.count({ where: { organizationId } })
          : prefix === "LAB-INS" ? await prisma.labInstrument.count({ where: { organizationId } })
            : prefix === "LAB-STB" ? await prisma.labStabilityStudy.count({ where: { organizationId } })
              : await prisma.labNonConformity.count({ where: { organizationId } });
  return `${prefix}-${String(count + 1).padStart(6, "0")}`;
}

export const limsProjectInclude = {
  responsible: true,
  formulationVersion: true,
  samples: { include: { tests: true, releases: true } },
  timelineEvents: { orderBy: { eventAt: "desc" as const }, take: 6 }
};

export const limsSampleInclude = {
  project: true,
  responsible: true,
  formulationVersion: true,
  tests: { include: { method: true, instrument: true, evidenceDocument: true } },
  stabilityStudies: { include: { points: true } },
  releases: { include: { responsible: true, tests: true } },
  timelineEvents: { orderBy: { eventAt: "desc" as const }, take: 8 }
};

export async function ensureApprovedVersion(organizationId: string, formulationVersionId?: string | null) {
  if (!formulationVersionId) return null;
  const version = await prisma.formulationVersion.findFirstOrThrow({ where: { id: formulationVersionId, organizationId } });
  if (version.status !== "aprobada") throw new Error("No se puede usar una version de formulacion no aprobada en LIMS.");
  return version;
}

export async function createLabProject(input: { organizationId: string; userId: string; name: string; projectType: string; objective: string; priority: "baja" | "media" | "alta" | "urgente"; formulationFamilyId?: string | null; formulationVersionId?: string | null; observations?: string | null }) {
  await ensureApprovedVersion(input.organizationId, input.formulationVersionId);
  const project = await prisma.labProject.create({
    data: {
      organizationId: input.organizationId,
      permanentCode: await nextLabCode("LAB-PRJ", input.organizationId),
      name: input.name,
      projectType: input.projectType,
      objective: input.objective,
      responsibleUserId: input.userId,
      priority: input.priority,
      status: "planeado",
      formulationFamilyId: input.formulationFamilyId ?? null,
      formulationVersionId: input.formulationVersionId ?? null,
      observations: input.observations ?? null,
      startDate: new Date()
    },
    include: limsProjectInclude
  });
  await prisma.labTimelineEvent.create({ data: { organizationId: input.organizationId, projectId: project.id, eventType: "creacion", title: "Proyecto creado", description: project.objective, createdByUserId: input.userId } });
  return project;
}

export async function createLabSample(input: { organizationId: string; userId: string; projectId: string; formulationFamilyId?: string | null; formulationVersionId?: string | null; pilotLotCode?: string | null; quantity: number; unit: string; location?: string | null; storageConditions?: string | null; observations?: string | null }) {
  const project = await prisma.labProject.findFirstOrThrow({ where: { id: input.projectId, organizationId: input.organizationId } });
  await ensureApprovedVersion(input.organizationId, input.formulationVersionId ?? project.formulationVersionId);
  const sample = await prisma.labSample.create({
    data: {
      organizationId: input.organizationId,
      permanentCode: await nextLabCode("LAB-SMP", input.organizationId),
      projectId: input.projectId,
      formulationFamilyId: input.formulationFamilyId ?? project.formulationFamilyId,
      formulationVersionId: input.formulationVersionId ?? project.formulationVersionId,
      pilotLotCode: input.pilotLotCode ?? null,
      preparedAt: new Date(),
      responsibleUserId: input.userId,
      quantity: input.quantity,
      unit: input.unit,
      location: input.location ?? null,
      storageConditions: input.storageConditions ?? null,
      status: "preparada",
      observations: input.observations ?? null
    },
    include: limsSampleInclude
  });
  await prisma.labTimelineEvent.create({ data: { organizationId: input.organizationId, projectId: project.id, sampleId: sample.id, eventType: "preparacion", title: "Muestra preparada", description: sample.observations, createdByUserId: input.userId } });
  return sample;
}

export async function createLabTest(input: { organizationId: string; userId: string; sampleId: string; methodId: string; testType: string; unit?: string | null; specification?: string | null; numericResult?: number | null; qualitativeResult?: string | null; instrumentId?: string | null; evidenceDocumentId?: string | null; observations?: string | null }) {
  const sample = await prisma.labSample.findFirstOrThrow({ where: { id: input.sampleId, organizationId: input.organizationId } });
  if (sample.released) throw new Error("No se puede modificar una muestra liberada sin nueva revision documentada.");
  const instrument = input.instrumentId ? await prisma.labInstrument.findFirstOrThrow({ where: { id: input.instrumentId, organizationId: input.organizationId } }) : null;
  const calibrationWarning = instrument?.nextCalibrationAt && instrument.nextCalibrationAt < new Date() ? "Advertencia: instrumento con calibracion vencida; autorizacion registrada en observaciones." : null;
  const conformityStatus = evaluateConformity(input.numericResult, input.specification);
  const test = await prisma.labTest.create({
    data: {
      organizationId: input.organizationId,
      permanentCode: await nextLabCode("LAB-TST", input.organizationId),
      sampleId: input.sampleId,
      methodId: input.methodId,
      testType: input.testType,
      unit: input.unit ?? null,
      specification: input.specification ?? null,
      numericResult: input.numericResult ?? null,
      qualitativeResult: input.qualitativeResult ?? null,
      instrumentId: input.instrumentId ?? null,
      analystUserId: input.userId,
      testedAt: new Date(),
      status: input.numericResult != null || input.qualitativeResult ? "completado" : "pendiente",
      conformityStatus,
      evidenceDocumentId: input.evidenceDocumentId ?? null,
      observations: [input.observations, calibrationWarning].filter(Boolean).join(" | ") || null
    },
    include: { method: true, instrument: true, sample: true, evidenceDocument: true }
  });
  await prisma.labTimelineEvent.create({ data: { organizationId: input.organizationId, projectId: sample.projectId, sampleId: sample.id, eventType: "ensayo", title: `Ensayo ${test.permanentCode}`, description: `${test.testType}: ${test.conformityStatus}`, createdByUserId: input.userId } });
  return test;
}

export async function updateLabResult(input: { organizationId: string; userId: string; testId: string; numericResult?: number | null; qualitativeResult?: string | null; conformityStatus: string; observations?: string | null }) {
  const test = await prisma.labTest.findFirstOrThrow({ where: { id: input.testId, organizationId: input.organizationId }, include: { sample: true } });
  if (test.releasedLocked) throw new Error("No se puede modificar un resultado liberado sin nueva revision documentada.");
  return prisma.labTest.update({
    where: { id: input.testId },
    data: { numericResult: input.numericResult ?? null, qualitativeResult: input.qualitativeResult ?? null, conformityStatus: input.conformityStatus, observations: input.observations ?? test.observations, status: "completado" },
    include: { method: true, instrument: true, sample: true, evidenceDocument: true }
  });
}

export async function invalidateLabTest(input: { organizationId: string; userId: string; testId: string; reason: string }) {
  const test = await prisma.labTest.findFirstOrThrow({ where: { id: input.testId, organizationId: input.organizationId } });
  if (test.releasedLocked) throw new Error("No se puede invalidar un resultado liberado sin nueva revision documentada.");
  return prisma.labTest.update({ where: { id: input.testId }, data: { status: "invalidado", invalidatedReason: input.reason } });
}

export async function repeatLabTest(input: { organizationId: string; userId: string; testId: string; reason: string }) {
  const test = await prisma.labTest.findFirstOrThrow({ where: { id: input.testId, organizationId: input.organizationId } });
  if (test.releasedLocked) throw new Error("No se puede repetir un resultado liberado sin nueva revision documentada.");
  await prisma.labTest.update({ where: { id: test.id }, data: { status: "repetido", invalidatedReason: input.reason } });
  return createLabTest({ organizationId: input.organizationId, userId: input.userId, sampleId: test.sampleId, methodId: test.methodId, testType: test.testType, unit: test.unit, specification: test.specification, instrumentId: test.instrumentId, evidenceDocumentId: test.evidenceDocumentId, observations: `Repeticion de ${test.permanentCode}: ${input.reason}` });
}

export async function releaseSample(input: { organizationId: string; userId: string; sampleId: string; decision: "aprobada" | "aprobada_con_observaciones" | "rechazada" | "pendiente"; conclusion: string; digitalConfirmation: string; testIds: string[]; documentIds: string[] }) {
  const tests = await prisma.labTest.findMany({ where: { id: { in: input.testIds }, sampleId: input.sampleId, organizationId: input.organizationId } });
  if (tests.length !== input.testIds.length) throw new Error("La liberacion requiere resultados validos de la misma muestra.");
  if (tests.some((test) => test.status === "pendiente" || test.status === "invalidado")) throw new Error("No se puede liberar con resultados pendientes o invalidos.");
  const release = await prisma.labTechnicalRelease.create({
    data: {
      organizationId: input.organizationId,
      sampleId: input.sampleId,
      decision: input.decision,
      responsibleUserId: input.userId,
      conclusion: input.conclusion,
      digitalConfirmation: input.digitalConfirmation,
      documentIdsJson: input.documentIds,
      tests: { connect: tests.map((test) => ({ id: test.id })) }
    },
    include: { sample: true, tests: true, responsible: true }
  });
  await prisma.labTest.updateMany({ where: { id: { in: input.testIds } }, data: { releasedLocked: true, status: "aprobado_tecnicamente" } });
  await prisma.labSample.update({ where: { id: input.sampleId }, data: { released: true, status: input.decision === "rechazada" ? "rechazada" : input.decision === "pendiente" ? "retenida" : "aprobada" } });
  return release;
}

export async function limsDashboard(organizationId: string) {
  const now = new Date();
  const next30 = new Date(now);
  next30.setDate(next30.getDate() + 30);
  const [activeProjects, samplesInEvaluation, pendingTests, nonConformingResults, activeStabilityStudies, instrumentsCalibrationSoon, pendingReleases] = await Promise.all([
    prisma.labProject.count({ where: { organizationId, status: { in: ["planeado", "activo", "pausado"] } } }),
    prisma.labSample.count({ where: { organizationId, status: "en_evaluacion" } }),
    prisma.labTest.count({ where: { organizationId, status: { in: ["pendiente", "en_proceso"] } } }),
    prisma.labTest.count({ where: { organizationId, conformityStatus: "no_conforme" } }),
    prisma.labStabilityStudy.count({ where: { organizationId, status: "activo" } }),
    prisma.labInstrument.count({ where: { organizationId, nextCalibrationAt: { lte: next30 } } }),
    prisma.labTechnicalRelease.count({ where: { organizationId, decision: "pendiente" } })
  ]);
  const recent = await prisma.labTimelineEvent.findMany({ where: { organizationId }, orderBy: { eventAt: "desc" }, take: 8 });
  return { activeProjects, samplesInEvaluation, pendingTests, nonConformingResults, activeStabilityStudies, instrumentsCalibrationSoon, pendingReleases, recent };
}

export function evaluateConformity(value?: number | null, specification?: string | null) {
  if (value == null || !specification) return "pendiente";
  const match = specification.match(/([0-9]+(?:\.[0-9]+)?)\s*-\s*([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return "pendiente";
  const min = Number(match[1]);
  const max = Number(match[2]);
  return value >= min && value <= max ? "conforme" : "no_conforme";
}
