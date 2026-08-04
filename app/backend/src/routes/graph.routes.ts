import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { recordAudit } from "../services/audit.service.js";
import { createGraphRelation, dashboardGraph, graphForEntity, searchGraph, syncGraph, twin360 } from "../services/graph.service.js";
import { createRelationSchema, graphQuerySchema, graphSearchSchema } from "../validators/graph.schemas.js";

export const graphRouter = Router();
graphRouter.use(requireAuth);

graphRouter.get("/dashboard", async (req, res, next) => {
  try {
    return res.json(await dashboardGraph(req.user!.organizationId));
  } catch (error) {
    return next(error);
  }
});

graphRouter.post("/sync", async (req, res, next) => {
  try {
    const result = await syncGraph(req.user!.organizationId, req.user!.id);
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "knowledge_graph", entityId: req.user!.organizationId, action: "grafo_sincronizado", after: result });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

graphRouter.get("/entities", async (req, res, next) => {
  try {
    const filters = graphSearchSchema.parse(req.query);
    return res.json(await searchGraph(req.user!.organizationId, filters));
  } catch (error) {
    return next(error);
  }
});

graphRouter.get("/types", async (req, res, next) => {
  try {
    const [entityTypes, relationTypes] = await Promise.all([
      prisma.graphEntityType.findMany({ where: { organizationId: req.user!.organizationId }, orderBy: { name: "asc" } }),
      prisma.graphRelationType.findMany({ where: { organizationId: req.user!.organizationId }, orderBy: { name: "asc" } })
    ]);
    return res.json({ entityTypes, relationTypes });
  } catch (error) {
    return next(error);
  }
});

graphRouter.get("/graph", async (req, res, next) => {
  try {
    const query = graphQuerySchema.parse(req.query);
    return res.json(await graphForEntity(req.user!.organizationId, query.entityId, query.depth));
  } catch (error) {
    return next(error);
  }
});

graphRouter.get("/entities/:id/twin", async (req, res, next) => {
  try {
    return res.json(await twin360(req.user!.organizationId, req.params.id));
  } catch (error) {
    return next(error);
  }
});

graphRouter.get("/entities/:id/timeline", async (req, res, next) => {
  try {
    const timeline = await prisma.graphEntityTimeline.findMany({ where: { organizationId: req.user!.organizationId, entityId: req.params.id }, include: { user: true }, orderBy: { eventAt: "desc" } });
    return res.json({ timeline });
  } catch (error) {
    return next(error);
  }
});

graphRouter.get("/entities/:id/events", async (req, res, next) => {
  try {
    const events = await prisma.graphEntityEvent.findMany({ where: { organizationId: req.user!.organizationId, entityId: req.params.id }, include: { user: true }, orderBy: { createdAt: "desc" } });
    return res.json({ events });
  } catch (error) {
    return next(error);
  }
});

graphRouter.get("/entities/:id/snapshots", async (req, res, next) => {
  try {
    const snapshots = await prisma.graphEntitySnapshot.findMany({ where: { organizationId: req.user!.organizationId, entityId: req.params.id }, orderBy: { capturedAt: "desc" } });
    return res.json({ snapshots });
  } catch (error) {
    return next(error);
  }
});

graphRouter.get("/entities/:id/metrics", async (req, res, next) => {
  try {
    const metrics = await prisma.graphEntityMetric.findMany({ where: { organizationId: req.user!.organizationId, entityId: req.params.id }, orderBy: { label: "asc" } });
    return res.json({ metrics });
  } catch (error) {
    return next(error);
  }
});

graphRouter.post("/relations", async (req, res, next) => {
  try {
    const input = createRelationSchema.parse(req.body);
    const relation = await createGraphRelation({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "entity_relation", entityId: relation.id, action: "relacion_creada", after: relation });
    return res.status(201).json({ relation });
  } catch (error) {
    return next(error);
  }
});

graphRouter.post("/relations/:id/deactivate", async (req, res, next) => {
  try {
    const relation = await prisma.graphEntityRelation.update({ where: { id: req.params.id }, data: { status: "inactiva" } });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "entity_relation", entityId: relation.id, action: "relacion_inactivada", after: relation });
    return res.json({ relation });
  } catch (error) {
    return next(error);
  }
});
