import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const allowedExtensions = new Set(["xlsx", "csv", "pdf", "txt"]);

export function pilotMode() {
  return {
    mode: "PILOTO",
    label: "PILOTO / NO PRODUCTIVO",
    nonProductive: true,
    protections: [
      "No genera facturacion.",
      "No libera productos comerciales.",
      "No consume inventario comercial irreversible.",
      "No aprueba formulaciones automaticamente.",
      "Toda prueba queda separada de produccion."
    ]
  };
}

async function nextCode(model: "pilotProduct" | "pilotImportBatch" | "pilotLabTrial" | "pilotLabTrialParameter" | "pilotLabTrialPhoto" | "pilotExperimentalVersion" | "labProject" | "labSample", prefix: string, organizationId: string) {
  const count = await (prisma[model] as any).count({ where: { organizationId } });
  return `${prefix}-${String(count + 1).padStart(6, "0")}`;
}

export function classifyPilotImportRow(row: Record<string, unknown>, rowReference: string) {
  const values = Object.values(row).map((value) => String(value ?? "").trim()).filter(Boolean);
  if (values.length === 0) return { action: "rechazado", status: "rechazado", message: "Fila vacia." };
  const joined = values.join(" ").toLowerCase();
  if (joined.includes("duplicado")) return { action: "posible_duplicado", status: "requiere_revision", message: `Posible duplicado detectado en ${rowReference}.` };
  if (joined.includes("conflicto")) return { action: "conflicto", status: "requiere_revision", message: `Conflicto requiere revision humana en ${rowReference}.` };
  return { action: "nuevo", status: "previsualizado", message: `Registro nuevo detectado en ${rowReference}.` };
}

function parseDelimited(buffer: Buffer, filename: string) {
  const text = buffer.toString("utf8");
  const rows = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 200);
  return rows.map((line, index) => {
    const separator = line.includes(";") ? ";" : ",";
    const values = line.split(separator).map((value) => value.trim());
    return { rowReference: `${filename}:L${index + 1}`, payload: { values, raw: line } };
  });
}

export function buildPilotWorksheetRows(version: any, trialSize: number) {
  return (version.ingredients ?? []).map((ingredient: any) => ({
    id: ingredient.id,
    phase: ingredient.phase,
    orderIndex: ingredient.orderIndex,
    ingredient: ingredient.displayName,
    inci: ingredient.inci,
    function: ingredient.cosmeticFunction,
    percentage: ingredient.percentage,
    grams: Number(((trialSize * ingredient.percentage) / 100).toFixed(4)),
    notes: ingredient.productionNotes ?? "Sin observaciones documentadas."
  })).sort((a: any, b: any) => a.phase.localeCompare(b.phase) || a.orderIndex - b.orderIndex);
}

export async function pilotDashboard(organizationId: string) {
  const [products, imports, trials, experimental, satisfactory, failed, materials, documents, formulations] = await Promise.all([
    prisma.pilotProduct.count({ where: { organizationId } }),
    prisma.pilotImportBatch.count({ where: { organizationId } }),
    prisma.pilotLabTrial.count({ where: { organizationId } }),
    prisma.pilotExperimentalVersion.count({ where: { organizationId } }),
    prisma.pilotLabTrial.count({ where: { organizationId, result: "satisfactorio" } }),
    prisma.pilotLabTrial.count({ where: { organizationId, result: "fallido" } }),
    prisma.rawMaterialMaster.count({ where: { organizationId } }),
    prisma.document.count({ where: { organizationId } }),
    prisma.formulationFamily.count({ where: { organizationId } })
  ]);
  return { mode: pilotMode(), indicators: { products, imports, trials, pendingTrials: await prisma.pilotLabTrial.count({ where: { organizationId, status: { in: ["planeada", "en_proceso"] } } }), experimental, satisfactory, failed, materials, documents, formulations } };
}

export async function listPilotProducts(organizationId: string) {
  return prisma.pilotProduct.findMany({ where: { organizationId }, include: { currentFormulationVersion: true, trials: true }, orderBy: { name: "asc" } });
}

export async function createPilotProduct(organizationId: string, input: any) {
  return prisma.pilotProduct.create({
    data: { organizationId, permanentCode: await nextCode("pilotProduct", "PIL-PROD", organizationId), ...input }
  });
}

export async function previewPilotImport(organizationId: string, userId: string, importKind: string, files: Express.Multer.File[]) {
  if (files.length === 0) throw new Error("Selecciona al menos un archivo.");
  const batch = await prisma.pilotImportBatch.create({
    data: { organizationId, createdByUserId: userId, importKind, sourceName: files.map((file) => file.originalname).join(", "), sourceType: "archivo", permanentCode: await nextCode("pilotImportBatch", "PIL-IMP", organizationId), summaryJson: {} }
  });

  const items = [];
  for (const file of files) {
    const extension = file.originalname.split(".").pop()?.toLowerCase() ?? "";
    if (!allowedExtensions.has(extension)) {
      items.push({ rowReference: file.originalname, targetEntity: importKind, action: "rechazado", status: "rechazado", payloadJson: { filename: file.originalname }, message: "Extension no admitida." });
      continue;
    }
    const rows = extension === "csv" || extension === "txt" ? parseDelimited(file.buffer, file.originalname) : [{ rowReference: `${file.originalname}:documento`, payload: { filename: file.originalname, extension, note: "Documento aceptado para revision y extraccion documental." } }];
    for (const row of rows) {
      const classification = classifyPilotImportRow(row.payload, row.rowReference);
      items.push({ rowReference: row.rowReference, targetEntity: importKind, action: classification.action, status: classification.status, payloadJson: row.payload, message: classification.message });
    }
  }
  const createdItems = await prisma.pilotImportItem.createMany({ data: items.map((item) => ({ organizationId, batchId: batch.id, ...item })) as any });
  const summary = summarizeImportItems(items);
  const updated = await prisma.pilotImportBatch.update({ where: { id: batch.id }, data: { summaryJson: summary as Prisma.InputJsonValue, status: summary.rejected > 0 || summary.review > 0 ? "requiere_revision" : "previsualizado" }, include: { items: true } });
  return { batch: updated, createdItems, summary };
}

function summarizeImportItems(items: Array<{ action: string; status: string }>) {
  return {
    total: items.length,
    newRecords: items.filter((item) => item.action === "nuevo").length,
    duplicates: items.filter((item) => item.action === "posible_duplicado").length,
    conflicts: items.filter((item) => item.action === "conflicto").length,
    review: items.filter((item) => item.status === "requiere_revision").length,
    rejected: items.filter((item) => item.status === "rechazado").length
  };
}

export async function commitPilotImport(organizationId: string, id: string) {
  const batch = await prisma.pilotImportBatch.findFirst({ where: { id, organizationId }, include: { items: true } });
  if (!batch) throw new Error("Importacion piloto no encontrada.");
  if (batch.items.some((item) => item.status === "rechazado")) throw new Error("No se puede confirmar una importacion con registros rechazados.");
  return prisma.pilotImportBatch.update({ where: { id }, data: { status: batch.items.some((item) => item.status === "requiere_revision") ? "requiere_revision" : "importado" }, include: { items: true } });
}

export async function listPilotTrials(organizationId: string) {
  return prisma.pilotLabTrial.findMany({ where: { organizationId }, include: { pilotProduct: true, formulationVersion: { include: { family: true, ingredients: true, phases: true } }, parameters: true, photos: true, experimentalVersions: true }, orderBy: { createdAt: "desc" } });
}

export async function createPilotTrial(organizationId: string, userId: string, input: any) {
  const version = await prisma.formulationVersion.findFirst({ where: { id: input.formulationVersionId, organizationId }, include: { family: true } });
  if (!version) throw new Error("Version de formulacion no encontrada.");
  const trialCode = await nextCode("pilotLabTrial", "PIL-TRI", organizationId);
  const project = await prisma.labProject.create({ data: { organizationId, permanentCode: await nextCode("labProject", "LAB-PIL", organizationId), name: `Proyecto ${trialCode}`, projectType: "piloto_no_productivo", objective: input.objective, responsibleUserId: userId, status: "planeado", formulationFamilyId: version.formulationFamilyId, formulationVersionId: version.id, observations: "PILOTO / NO PRODUCTIVO. No libera producto comercial." } });
  const sample = await prisma.labSample.create({ data: { organizationId, permanentCode: await nextCode("labSample", "MUE-PIL", organizationId), projectId: project.id, formulationFamilyId: version.formulationFamilyId, formulationVersionId: version.id, pilotLotCode: trialCode, preparedAt: new Date(), responsibleUserId: userId, quantity: input.trialSize, unit: input.unit, status: "preparada", observations: "Muestra piloto no productiva.", released: false } });
  return prisma.pilotLabTrial.create({ data: { organizationId, permanentCode: trialCode, pilotProductId: input.pilotProductId, labProjectId: project.id, labSampleId: sample.id, formulationFamilyId: version.formulationFamilyId, formulationVersionId: version.id, trialSize: input.trialSize, unit: input.unit, objective: input.objective, responsibleUserId: userId }, include: { pilotProduct: true, formulationVersion: { include: { family: true, ingredients: true, phases: true } }, parameters: true } });
}

export async function pilotTrialWorksheet(organizationId: string, id: string) {
  const trial = await prisma.pilotLabTrial.findFirst({ where: { id, organizationId }, include: { formulationVersion: { include: { ingredients: true, phases: true, family: true } }, parameters: true, photos: true } });
  if (!trial?.formulationVersion) throw new Error("Prueba piloto no encontrada.");
  return { trial, rows: buildPilotWorksheetRows(trial.formulationVersion, Number(trial.trialSize)) };
}

export async function recordPilotParameter(organizationId: string, userId: string, trialId: string, input: any) {
  const trial = await prisma.pilotLabTrial.findFirst({ where: { id: trialId, organizationId } });
  if (!trial) throw new Error("Prueba piloto no encontrada.");
  if (trial.status === "terminada") throw new Error("No se editan parametros de una prueba terminada.");
  return prisma.pilotLabTrialParameter.create({ data: { organizationId, trialId, permanentCode: await nextCode("pilotLabTrialParameter", "PIL-PAR", organizationId), userId, ...input } });
}

export async function finishPilotTrial(organizationId: string, id: string, input: any) {
  const trial = await prisma.pilotLabTrial.findFirst({ where: { id, organizationId }, include: { parameters: true } });
  if (!trial) throw new Error("Prueba piloto no encontrada.");
  if (trial.parameters.length === 0) throw new Error("No se puede cerrar una prueba sin parametros registrados.");
  return prisma.pilotLabTrial.update({ where: { id }, data: { status: "terminada", result: input.result, whatWorked: input.whatWorked, whatFailed: input.whatFailed, suggestedChanges: input.suggestedChanges, observations: input.observations, finishedAt: new Date() } });
}

export async function createPilotExperimentalVersion(organizationId: string, userId: string, trialId: string, changeSummary: string) {
  const trial = await prisma.pilotLabTrial.findFirst({ where: { id: trialId, organizationId } });
  if (!trial?.formulationVersionId) throw new Error("La prueba no tiene version de formulacion origen.");
  return prisma.pilotExperimentalVersion.create({ data: { organizationId, permanentCode: await nextCode("pilotExperimentalVersion", "PIL-EXP", organizationId), trialId, sourceFormulationVersionId: trial.formulationVersionId, changeSummary, createdByUserId: userId } });
}
