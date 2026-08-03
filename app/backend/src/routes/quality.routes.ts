import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { recordAudit } from "../services/audit.service.js";
import { createCapa, createDeviation, createDisposition, createInspection, createNcf, createRelease, qualityDashboard, qualityInspectionInclude } from "../services/quality.service.js";
import { createCapaSchema, createDeviationSchema, createDispositionSchema, createInspectionSchema, createNcfSchema, createReleaseSchema, listQualitySchema } from "../validators/quality.schemas.js";

export const qualityRouter = Router();
qualityRouter.use(requireAuth);

function qualityError(error: unknown, res: import("express").Response, next: import("express").NextFunction) {
  if (error instanceof Error && /No se puede|requiere|liberar|obsoleta|contencion|disposicion/i.test(error.message)) return res.status(409).json({ message: error.message });
  return next(error);
}

qualityRouter.get("/dashboard", async (req, res, next) => {
  try {
    return res.json({ indicators: await qualityDashboard(req.user!.organizationId) });
  } catch (error) {
    return next(error);
  }
});

qualityRouter.get("/specifications", async (req, res, next) => {
  try {
    const query = listQualitySchema.parse(req.query);
    const specifications = await prisma.qualitySpecification.findMany({
      where: { organizationId: req.user!.organizationId, ...(query.status ? { status: query.status as never } : {}), ...(query.search ? { OR: [{ permanentCode: { contains: query.search } }, { name: { contains: query.search } }, { entityType: { contains: query.search } }] } : {}) },
      orderBy: { updatedAt: "desc" },
      include: { criteria: true, document: true, responsible: true }
    });
    return res.json({ specifications });
  } catch (error) {
    return next(error);
  }
});

qualityRouter.get("/sampling-plans", async (req, res, next) => {
  try {
    const plans = await prisma.qualitySamplingPlan.findMany({ where: { organizationId: req.user!.organizationId }, orderBy: { createdAt: "desc" }, include: { responsible: true } });
    return res.json({ plans });
  } catch (error) {
    return next(error);
  }
});

qualityRouter.get("/inspections", async (req, res, next) => {
  try {
    const query = listQualitySchema.parse(req.query);
    const inspections = await prisma.qualityInspection.findMany({
      where: { organizationId: req.user!.organizationId, ...(query.status ? { status: query.status as never } : {}), ...(query.search ? { OR: [{ permanentCode: { contains: query.search } }, { supplierName: { contains: query.search } }, { lotId: { contains: query.search } }] } : {}) },
      orderBy: { updatedAt: "desc" },
      include: qualityInspectionInclude
    });
    return res.json({ inspections });
  } catch (error) {
    return next(error);
  }
});

qualityRouter.post("/inspections", async (req, res, next) => {
  try {
    const input = createInspectionSchema.parse(req.body);
    const inspection = await createInspection({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "quality_inspection", entityId: inspection.id, action: "calidad_inspeccion_creada", after: inspection });
    return res.status(201).json({ inspection });
  } catch (error) {
    return qualityError(error, res, next);
  }
});

qualityRouter.get("/releases", async (req, res, next) => {
  try {
    const releases = await prisma.qualityRelease.findMany({ where: { organizationId: req.user!.organizationId }, include: { specification: true, inspection: true, evidenceDocument: true, responsible: true }, orderBy: { createdAt: "desc" } });
    return res.json({ releases });
  } catch (error) {
    return next(error);
  }
});

qualityRouter.post("/releases", async (req, res, next) => {
  try {
    const input = createReleaseSchema.parse(req.body);
    const release = await createRelease({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "quality_release", entityId: release.id, action: "calidad_decision_liberacion", after: release });
    return res.status(201).json({ release });
  } catch (error) {
    return qualityError(error, res, next);
  }
});

qualityRouter.get("/deviations", async (req, res, next) => {
  try {
    const deviations = await prisma.qualityDeviation.findMany({ where: { organizationId: req.user!.organizationId }, include: { responsible: true, evidenceDocument: true, capas: true }, orderBy: { createdAt: "desc" } });
    return res.json({ deviations });
  } catch (error) {
    return next(error);
  }
});

qualityRouter.post("/deviations", async (req, res, next) => {
  try {
    const input = createDeviationSchema.parse(req.body);
    const deviation = await createDeviation({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "quality_deviation", entityId: deviation.id, action: "calidad_desviacion_creada", after: deviation });
    return res.status(201).json({ deviation });
  } catch (error) {
    return qualityError(error, res, next);
  }
});

qualityRouter.get("/non-conformities", async (req, res, next) => {
  try {
    const nonConformities = await prisma.qualityNonConformity.findMany({ where: { organizationId: req.user!.organizationId }, include: { responsible: true, evidenceDocument: true, capas: true, dispositions: true }, orderBy: { createdAt: "desc" } });
    return res.json({ nonConformities });
  } catch (error) {
    return next(error);
  }
});

qualityRouter.post("/non-conformities", async (req, res, next) => {
  try {
    const input = createNcfSchema.parse(req.body);
    const nonConformity = await createNcf({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "quality_non_conformity", entityId: nonConformity.id, action: "calidad_no_conformidad_creada", after: nonConformity });
    return res.status(201).json({ nonConformity });
  } catch (error) {
    return qualityError(error, res, next);
  }
});

qualityRouter.get("/capa", async (req, res, next) => {
  try {
    const capa = await prisma.qualityCapaAction.findMany({ where: { organizationId: req.user!.organizationId }, include: { responsible: true, deviation: true, nonConformity: true, evidenceDocument: true }, orderBy: { targetDate: "asc" } });
    return res.json({ capa });
  } catch (error) {
    return next(error);
  }
});

qualityRouter.post("/capa", async (req, res, next) => {
  try {
    const input = createCapaSchema.parse(req.body);
    const capa = await createCapa({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "quality_capa", entityId: capa.id, action: "calidad_capa_creada", after: capa });
    return res.status(201).json({ capa });
  } catch (error) {
    return qualityError(error, res, next);
  }
});

qualityRouter.get("/dispositions", async (req, res, next) => {
  try {
    const dispositions = await prisma.qualityDisposition.findMany({ where: { organizationId: req.user!.organizationId }, include: { responsible: true, nonConformity: true, evidenceDocument: true }, orderBy: { createdAt: "desc" } });
    return res.json({ dispositions });
  } catch (error) {
    return next(error);
  }
});

qualityRouter.post("/dispositions", async (req, res, next) => {
  try {
    const input = createDispositionSchema.parse(req.body);
    const disposition = await createDisposition({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "quality_disposition", entityId: disposition.id, action: "calidad_disposicion_creada", after: disposition });
    return res.status(201).json({ disposition });
  } catch (error) {
    return qualityError(error, res, next);
  }
});
