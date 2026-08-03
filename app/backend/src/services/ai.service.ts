import { prisma } from "../db.js";
import type { AiRule, AiRuleSeverity } from "@prisma/client";

type RuleData = Record<string, unknown>;

async function nextCode(organizationId: string, prefix: string, model: "aiRule" | "aiRuleEvaluation" | "aiAlert" | "aiQuery" | "aiResponse" | "learningEvent" | "aiSourceConfig") {
  const count =
    model === "aiRule" ? await prisma.aiRule.count({ where: { OR: [{ organizationId }, { organizationId: null }] } }) :
    model === "aiRuleEvaluation" ? await prisma.aiRuleEvaluation.count({ where: { organizationId } }) :
    model === "aiAlert" ? await prisma.aiAlert.count({ where: { organizationId } }) :
    model === "aiQuery" ? await prisma.aiQuery.count({ where: { organizationId } }) :
    model === "aiResponse" ? await prisma.aiResponse.count({ where: { organizationId } }) :
    model === "learningEvent" ? await prisma.learningEvent.count({ where: { organizationId } }) :
    await prisma.aiSourceConfig.count({ where: { OR: [{ organizationId }, { organizationId: null }] } });
  return `${prefix}-${String(count + 1).padStart(6, "0")}`;
}

export function evaluateStructuredCondition(condition: RuleData, data: RuleData) {
  const field = String(condition.field ?? "");
  const operator = String(condition.operator ?? "exists");
  const expected = condition.value;
  const actual = data[field];
  if (!field) return { triggered: false, reason: "Regla sin campo estructurado." };
  if (operator === "exists") return { triggered: actual !== undefined && actual !== null && actual !== "", reason: `${field} existe.` };
  if (operator === "missing") return { triggered: actual === undefined || actual === null || actual === "", reason: `${field} no tiene dato suficiente.` };
  if (operator === "lt") return { triggered: Number(actual) < Number(expected), reason: `${field} menor que ${expected}.` };
  if (operator === "gt") return { triggered: Number(actual) > Number(expected), reason: `${field} mayor que ${expected}.` };
  if (operator === "neq") return { triggered: actual !== expected, reason: `${field} distinto de ${expected}.` };
  if (operator === "contains") return { triggered: String(actual ?? "").toLowerCase().includes(String(expected ?? "").toLowerCase()), reason: `${field} contiene ${expected}.` };
  if (operator === "in") return { triggered: Array.isArray(expected) && expected.includes(actual), reason: `${field} esta dentro del conjunto definido.` };
  return { triggered: false, reason: "Operador no soportado por el evaluador MVP." };
}

export async function aiDashboard(organizationId: string) {
  const [rules, evaluations, alerts, queries, responses, learning, sources, unindexedDocs] = await Promise.all([
    prisma.aiRule.findMany({ where: { OR: [{ organizationId }, { organizationId: null }] }, include: { evidenceDocument: true }, orderBy: { updatedAt: "desc" }, take: 12 }),
    prisma.aiRuleEvaluation.findMany({ where: { organizationId }, include: { rule: true }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.aiAlert.findMany({ where: { organizationId }, include: { rule: true, evidenceDocument: true }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.aiQuery.findMany({ where: { organizationId }, include: { response: true }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.aiResponse.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.learningEvent.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.aiSourceConfig.findMany({ where: { OR: [{ organizationId }, { organizationId: null }] }, orderBy: { priority: "asc" }, take: 12 }),
    prisma.document.count({ where: { organizationId, indexingStatus: { not: "indexado" } } })
  ]);
  return {
    indicators: {
      activeRules: rules.filter((rule) => rule.status === "validada").length,
      criticalRules: rules.filter((rule) => rule.severity === "critica").length,
      recentEvaluations: evaluations.length,
      openAlerts: alerts.filter((alert) => alert.status === "abierta").length,
      queries: queries.length,
      lowConfidenceResponses: responses.filter((response) => Number(response.confidence) < 0.6).length,
      unindexedDocs,
      learningEvents: learning.length,
      obsoleteSources: sources.filter((source) => source.validUntil && source.validUntil < new Date()).length
    },
    rules,
    evaluations,
    alerts,
    queries,
    responses,
    learning,
    sources
  };
}

export async function createAiRule(input: { organizationId: string; userId: string; name: string; description: string; ruleType: string; conditionJson: RuleData; severity: AiRuleSeverity; resultMessage: string; source: string; evidenceDocumentId?: string | null; confidence: number }) {
  const code = await nextCode(input.organizationId, "AI-RUL", "aiRule");
  return prisma.aiRule.create({ data: { organizationId: input.organizationId, permanentCode: code, name: input.name, description: input.description, ruleType: input.ruleType, conditionJson: input.conditionJson as never, severity: input.severity, resultMessage: input.resultMessage, source: input.source, evidenceDocumentId: input.evidenceDocumentId, responsibleUserId: input.userId, confidence: input.confidence, status: "borrador" }, include: { evidenceDocument: true, responsible: true } });
}

export async function evaluateRules(input: { organizationId: string; userId: string; entityType: string; entityId: string; data: RuleData; ruleType?: string | null }) {
  const rules = await prisma.aiRule.findMany({ where: { OR: [{ organizationId: input.organizationId }, { organizationId: null }], status: "validada", ...(input.ruleType ? { ruleType: input.ruleType } : {}) }, include: { evidenceDocument: true } });
  const results = [];
  for (const rule of rules) {
    const evaluated = evaluateStructuredCondition(rule.conditionJson as RuleData, input.data);
    const code = await nextCode(input.organizationId, "AI-EVL", "aiRuleEvaluation");
    const evaluation = await prisma.aiRuleEvaluation.create({ data: { organizationId: input.organizationId, permanentCode: code, ruleId: rule.id, entityType: input.entityType, entityId: input.entityId, result: evaluated.triggered ? "activada" : "sin_hallazgo", severity: rule.severity, evidenceJson: { reason: evaluated.reason, source: rule.source, document: rule.evidenceDocument?.originalFilename ?? null }, evaluatedByUserId: input.userId, ruleVersionNumber: rule.versionNumber, evaluatedDataJson: input.data as never } });
    let alert = null;
    if (evaluated.triggered) {
      const alertCode = await nextCode(input.organizationId, "AI-ALT", "aiAlert");
      alert = await prisma.aiAlert.create({ data: { organizationId: input.organizationId, permanentCode: alertCode, ruleId: rule.id, evaluationId: evaluation.id, entityType: input.entityType, entityId: input.entityId, detected: rule.resultMessage, explanation: evaluated.reason, source: rule.source, confidence: rule.confidence, severity: rule.severity, suggestedAction: "Revisar con responsable antes de tomar decision.", validationResponsible: rule.responsibleUserId, evidenceDocumentId: rule.evidenceDocumentId } });
    }
    results.push({ rule, evaluation, alert, triggered: evaluated.triggered, reason: evaluated.reason });
  }
  return results;
}

async function retrieveEvidence(organizationId: string, queryText: string, moduleScope?: string | null) {
  const terms = queryText.toLowerCase().split(/\s+/).filter((term) => term.length > 3).slice(0, 5);
  const docs = await prisma.document.findMany({
    where: { organizationId, ...(terms.length ? { OR: terms.flatMap((term) => [{ originalFilename: { contains: term } }, { title: { contains: term } }, { summary: { contains: term } }]) } : {}) },
    include: { chunks: { take: 3 }, ocrResults: { take: 2 }, documentType: true },
    take: 6
  });
  const rawMaterials = queryText.toLowerCase().includes("sci") ? await prisma.rawMaterialMaster.findMany({ where: { organizationId, OR: [{ commonName: { contains: "SCI" } }, { commercialName: { contains: "SCI" } }] }, take: 5 }) : [];
  const lots = queryText.toLowerCase().includes("caducar") ? await prisma.rawMaterialLot.findMany({ where: { organizationId }, orderBy: { expirationDate: "asc" }, take: 5 }) : [];
  const quotes = queryText.toLowerCase().includes("pedido") ? await prisma.salesOrder.findMany({ where: { organizationId }, orderBy: { updatedAt: "desc" }, take: 5 }) : [];
  return { docs, rawMaterials, lots, orders: quotes, moduleScope };
}

export async function askResponsibleAi(input: { organizationId: string; userId: string; queryText: string; moduleScope?: string | null; entityType?: string | null; entityId?: string | null }) {
  const queryCode = await nextCode(input.organizationId, "AI-QRY", "aiQuery");
  const query = await prisma.aiQuery.create({ data: { organizationId: input.organizationId, permanentCode: queryCode, queryText: input.queryText, moduleScope: input.moduleScope, entityType: input.entityType, entityId: input.entityId, userId: input.userId } });
  const evidence = await retrieveEvidence(input.organizationId, input.queryText, input.moduleScope);
  const sources = [
    ...evidence.docs.map((doc) => ({ type: "documento", id: doc.id, title: doc.title ?? doc.originalFilename, validationStatus: doc.status, sourceReference: doc.chunks[0]?.sourceReference ?? doc.ocrResults[0]?.sourceReference ?? "metadata" })),
    ...evidence.rawMaterials.map((item) => ({ type: "materia_prima", id: item.id, title: item.commonName, validationStatus: item.status })),
    ...evidence.lots.map((item) => ({ type: "lote", id: item.id, title: item.lotCode, validationStatus: item.status, expirationDate: item.expirationDate })),
    ...evidence.orders.map((item) => ({ type: "pedido", id: item.id, title: item.permanentCode, validationStatus: item.status }))
  ];
  const insufficient = sources.length === 0;
  const answer = insufficient ? "Información insuficiente para evaluar" : `Respuesta basada en ${sources.length} fuente(s) registrada(s). Se muestran referencias y advertencias para validacion humana.`;
  const responseCode = await nextCode(input.organizationId, "AI-RSP", "aiResponse");
  const response = await prisma.aiResponse.create({ data: { organizationId: input.organizationId, permanentCode: responseCode, queryId: query.id, answer, sourcesJson: sources as never, documentsJson: evidence.docs.map((doc) => ({ id: doc.id, name: doc.originalFilename })) as never, fragmentsJson: evidence.docs.flatMap((doc) => doc.chunks.map((chunk) => ({ documentId: doc.id, reference: chunk.sourceReference, text: chunk.content.slice(0, 220) }))) as never, confidence: insufficient ? 0.2 : 0.78, informationDate: new Date(), warningsJson: insufficient ? ["No hay evidencia suficiente en la organizacion."] : ["Respuesta no validada automaticamente."], validationStatus: "no_validada", outputType: insufficient ? "informacion_insuficiente" : "dato_documental", documentId: evidence.docs[0]?.id } });
  return { query, response };
}

export async function createLearningEvent(input: { organizationId: string; userId: string; context: string; inputJson: RuleData; proposedOutputJson?: RuleData | null; correctionJson?: RuleData | null; entityType?: string | null; entityId?: string | null; modelOrRule?: string | null }) {
  const code = await nextCode(input.organizationId, "AI-LRN", "learningEvent");
  return prisma.learningEvent.create({ data: { organizationId: input.organizationId, permanentCode: code, context: input.context, inputJson: input.inputJson as never, proposedOutputJson: input.proposedOutputJson as never, correctionJson: input.correctionJson as never, userId: input.userId, entityType: input.entityType, entityId: input.entityId, modelOrRule: input.modelOrRule } });
}
