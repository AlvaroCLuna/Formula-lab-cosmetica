import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { recordAudit } from "../services/audit.service.js";
import { aiDashboard, askResponsibleAi, createAiRule, createLearningEvent, evaluateRules } from "../services/ai.service.js";
import { aiListSchema, askAiSchema, createRuleSchema, evaluateRulesSchema, learningEventSchema } from "../validators/ai.schemas.js";

export const aiRouter = Router();
aiRouter.use(requireAuth);

function aiError(error: unknown, res: import("express").Response, next: import("express").NextFunction) {
  if (error instanceof Error && /evidencia|regla|evaluar|informacion|fuente/i.test(error.message)) return res.status(409).json({ message: error.message });
  return next(error);
}

aiRouter.get("/dashboard", async (req, res, next) => {
  try {
    return res.json(await aiDashboard(req.user!.organizationId));
  } catch (error) {
    return next(error);
  }
});

aiRouter.get("/rules", async (req, res, next) => {
  try {
    const query = aiListSchema.parse(req.query);
    const rules = await prisma.aiRule.findMany({ where: { OR: [{ organizationId: req.user!.organizationId }, { organizationId: null }], ...(query.type ? { ruleType: query.type } : {}), ...(query.status ? { status: query.status as never } : {}), ...(query.severity ? { severity: query.severity as never } : {}) }, include: { evidenceDocument: true, responsible: true }, orderBy: { updatedAt: "desc" } });
    return res.json({ rules });
  } catch (error) {
    return next(error);
  }
});

aiRouter.post("/rules", async (req, res, next) => {
  try {
    const input = createRuleSchema.parse(req.body);
    const rule = await createAiRule({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "ai_rule", entityId: rule.id, action: "ia_regla_creada", after: rule });
    return res.status(201).json({ rule });
  } catch (error) {
    return aiError(error, res, next);
  }
});

aiRouter.post("/evaluate", async (req, res, next) => {
  try {
    const input = evaluateRulesSchema.parse(req.body);
    const results = await evaluateRules({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: input.entityType, entityId: input.entityId, action: "ia_reglas_evaluadas", after: results });
    return res.json({ results });
  } catch (error) {
    return aiError(error, res, next);
  }
});

aiRouter.get("/alerts", async (req, res, next) => {
  try {
    const alerts = await prisma.aiAlert.findMany({ where: { organizationId: req.user!.organizationId }, include: { rule: true, evidenceDocument: true }, orderBy: { createdAt: "desc" } });
    return res.json({ alerts });
  } catch (error) {
    return next(error);
  }
});

aiRouter.post("/ask", async (req, res, next) => {
  try {
    const input = askAiSchema.parse(req.body);
    const result = await askResponsibleAi({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "ai_query", entityId: result.query.id, action: "ia_consulta_realizada", after: result });
    return res.status(201).json(result);
  } catch (error) {
    return aiError(error, res, next);
  }
});

aiRouter.get("/queries", async (req, res, next) => {
  try {
    const queries = await prisma.aiQuery.findMany({ where: { organizationId: req.user!.organizationId }, include: { response: true, user: true }, orderBy: { createdAt: "desc" } });
    return res.json({ queries });
  } catch (error) {
    return next(error);
  }
});

aiRouter.get("/responses", async (req, res, next) => {
  try {
    const responses = await prisma.aiResponse.findMany({ where: { organizationId: req.user!.organizationId }, include: { query: true, document: true }, orderBy: { createdAt: "desc" } });
    return res.json({ responses });
  } catch (error) {
    return next(error);
  }
});

aiRouter.post("/learning-events", async (req, res, next) => {
  try {
    const input = learningEventSchema.parse(req.body);
    const event = await createLearningEvent({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "learning_event", entityId: event.id, action: "ia_aprendizaje_registrado", after: event });
    return res.status(201).json({ event });
  } catch (error) {
    return aiError(error, res, next);
  }
});

aiRouter.get("/learning-events", async (req, res, next) => {
  try {
    const events = await prisma.learningEvent.findMany({ where: { organizationId: req.user!.organizationId }, include: { user: true }, orderBy: { createdAt: "desc" } });
    return res.json({ events });
  } catch (error) {
    return next(error);
  }
});

aiRouter.get("/sources", async (req, res, next) => {
  try {
    const sources = await prisma.aiSourceConfig.findMany({ where: { OR: [{ organizationId: req.user!.organizationId }, { organizationId: null }] }, include: { document: true, responsible: true }, orderBy: { priority: "asc" } });
    return res.json({ sources });
  } catch (error) {
    return next(error);
  }
});
