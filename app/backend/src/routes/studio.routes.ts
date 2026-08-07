import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { recordAudit } from "../services/audit.service.js";
import { createConfiguredWorkflow, getStudioWorkflow, listStudioWorkflows, publishStudioVersion, simulateStudioVersion, startStudioInstance, studioDashboard, studioPalette, syncStudioToGraph } from "../services/studio.service.js";
import { createWorkflowSchema, startWorkflowInstanceSchema, studioSearchSchema } from "../validators/studio.schemas.js";

export const studioRouter = Router();
studioRouter.use(requireAuth);

studioRouter.get("/dashboard", async (req, res, next) => {
  try {
    return res.json(await studioDashboard(req.user!.organizationId));
  } catch (error) {
    return next(error);
  }
});

studioRouter.get("/palette", (_req, res) => res.json(studioPalette()));

studioRouter.get("/workflows", async (req, res, next) => {
  try {
    const filters = studioSearchSchema.parse(req.query);
    return res.json(await listStudioWorkflows(req.user!.organizationId, filters));
  } catch (error) {
    return next(error);
  }
});

studioRouter.get("/workflows/:id", async (req, res, next) => {
  try {
    return res.json(await getStudioWorkflow(req.user!.organizationId, req.params.id));
  } catch (error) {
    return next(error);
  }
});

studioRouter.post("/workflows", async (req, res, next) => {
  try {
    const input = createWorkflowSchema.parse(req.body);
    const workflow = await createConfiguredWorkflow({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "workflow_definition", entityId: workflow.id, action: "workflow_creado", after: workflow });
    return res.status(201).json({ workflow });
  } catch (error) {
    return next(error);
  }
});

studioRouter.post("/workflows/:id/versions/:versionId/simulate", async (req, res, next) => {
  try {
    const result = await simulateStudioVersion(req.user!.organizationId, req.params.versionId);
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "workflow_version", entityId: req.params.versionId, action: "workflow_simulado", after: result.simulation });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

studioRouter.post("/workflows/:id/versions/:versionId/publish", async (req, res, next) => {
  try {
    const result = await publishStudioVersion(req.user!.organizationId, req.params.id, req.params.versionId);
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "workflow_version", entityId: req.params.versionId, action: "workflow_publicado", after: result });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

studioRouter.post("/instances", async (req, res, next) => {
  try {
    const input = startWorkflowInstanceSchema.parse(req.body);
    const result = await startStudioInstance({ organizationId: req.user!.organizationId, userId: req.user!.id, workflowDefinitionId: input.workflowDefinitionId, workflowVersionId: input.workflowVersionId, entityType: input.entityType, entityId: input.entityId, payload: input.input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "workflow_instance", entityId: result.instance.id, action: "workflow_instancia_creada", after: result.instance });
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
});

studioRouter.get("/instances", async (req, res, next) => {
  try {
    const instances = await prisma.workflowInstance.findMany({ where: { organizationId: req.user!.organizationId }, include: { definition: true, version: true, logs: true }, orderBy: { startedAt: "desc" }, take: 80 });
    return res.json({ instances });
  } catch (error) {
    return next(error);
  }
});

studioRouter.get("/forms", async (req, res, next) => {
  try {
    const forms = await prisma.dynamicForm.findMany({ where: { organizationId: req.user!.organizationId }, include: { fields: { orderBy: { sortOrder: "asc" } }, versions: { orderBy: { versionNumber: "desc" }, take: 2 } }, orderBy: { name: "asc" } });
    return res.json({ forms });
  } catch (error) {
    return next(error);
  }
});

studioRouter.get("/checklists", async (req, res, next) => {
  try {
    const checklists = await prisma.checklist.findMany({ where: { organizationId: req.user!.organizationId }, include: { items: { orderBy: { sortOrder: "asc" } } }, orderBy: { name: "asc" } });
    return res.json({ checklists });
  } catch (error) {
    return next(error);
  }
});

studioRouter.get("/templates", async (req, res, next) => {
  try {
    const templates = await prisma.workflowTemplate.findMany({ where: { organizationId: req.user!.organizationId }, include: { workflowVersion: true }, orderBy: { name: "asc" } });
    return res.json({ templates });
  } catch (error) {
    return next(error);
  }
});

studioRouter.get("/events", async (req, res, next) => {
  try {
    const events = await prisma.workflowEvent.findMany({ where: { organizationId: req.user!.organizationId }, include: { definition: true }, orderBy: { permanentCode: "asc" } });
    return res.json({ events });
  } catch (error) {
    return next(error);
  }
});

studioRouter.get("/variables", async (req, res, next) => {
  try {
    const variables = await prisma.workflowVariable.findMany({ where: { organizationId: req.user!.organizationId }, orderBy: { name: "asc" } });
    return res.json({ variables });
  } catch (error) {
    return next(error);
  }
});

studioRouter.post("/sync-graph", async (req, res, next) => {
  try {
    const result = await syncStudioToGraph(req.user!.organizationId, req.user!.id);
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "formula_lab_studio", entityId: req.user!.organizationId, action: "studio_sincronizado_grafo", after: result });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});
