import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { recordAudit } from "../services/audit.service.js";
import { createLabProject, createLabSample, createLabTest, invalidateLabTest, limsDashboard, limsProjectInclude, limsSampleInclude, releaseSample, repeatLabTest, updateLabResult } from "../services/lims.service.js";
import { createLabProjectSchema, createLabSampleSchema, createLabTestSchema, invalidateLabTestSchema, listLimsSchema, releaseSampleSchema, updateLabResultSchema } from "../validators/lims.schemas.js";

export const limsRouter = Router();
limsRouter.use(requireAuth);

function limsError(error: unknown, res: import("express").Response, next: import("express").NextFunction) {
  if (error instanceof Error && /No se puede|requiere|liberada|calibracion|version/i.test(error.message)) return res.status(409).json({ message: error.message });
  return next(error);
}

limsRouter.get("/dashboard", async (req, res, next) => {
  try {
    return res.json({ indicators: await limsDashboard(req.user!.organizationId) });
  } catch (error) {
    return next(error);
  }
});

limsRouter.get("/projects", async (req, res, next) => {
  try {
    const query = listLimsSchema.parse(req.query);
    const projects = await prisma.labProject.findMany({
      where: {
        organizationId: req.user!.organizationId,
        ...(query.status ? { status: query.status as never } : {}),
        ...(query.search ? { OR: [{ permanentCode: { contains: query.search } }, { name: { contains: query.search } }, { projectType: { contains: query.search } }] } : {})
      },
      orderBy: { updatedAt: "desc" },
      include: limsProjectInclude
    });
    return res.json({ projects });
  } catch (error) {
    return next(error);
  }
});

limsRouter.post("/projects", async (req, res, next) => {
  try {
    const input = createLabProjectSchema.parse(req.body);
    const project = await createLabProject({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "lab_project", entityId: project.id, action: "lims_proyecto_creado", after: project });
    return res.status(201).json({ project });
  } catch (error) {
    return limsError(error, res, next);
  }
});

limsRouter.get("/samples", async (req, res, next) => {
  try {
    const query = listLimsSchema.parse(req.query);
    const samples = await prisma.labSample.findMany({
      where: {
        organizationId: req.user!.organizationId,
        ...(query.status ? { status: query.status as never } : {}),
        ...(query.search ? { OR: [{ permanentCode: { contains: query.search } }, { pilotLotCode: { contains: query.search } }, { project: { name: { contains: query.search } } }] } : {})
      },
      orderBy: { updatedAt: "desc" },
      include: limsSampleInclude
    });
    return res.json({ samples });
  } catch (error) {
    return next(error);
  }
});

limsRouter.post("/samples", async (req, res, next) => {
  try {
    const input = createLabSampleSchema.parse(req.body);
    const sample = await createLabSample({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "lab_sample", entityId: sample.id, action: "lims_muestra_creada", after: sample });
    return res.status(201).json({ sample });
  } catch (error) {
    return limsError(error, res, next);
  }
});

limsRouter.get("/methods", async (req, res, next) => {
  try {
    const methods = await prisma.labTestMethod.findMany({ where: { organizationId: req.user!.organizationId }, orderBy: { name: "asc" } });
    return res.json({ methods });
  } catch (error) {
    return next(error);
  }
});

limsRouter.get("/instruments", async (req, res, next) => {
  try {
    const instruments = await prisma.labInstrument.findMany({ where: { organizationId: req.user!.organizationId }, orderBy: { name: "asc" } });
    return res.json({ instruments });
  } catch (error) {
    return next(error);
  }
});

limsRouter.get("/tests", async (req, res, next) => {
  try {
    const query = listLimsSchema.parse(req.query);
    const tests = await prisma.labTest.findMany({
      where: {
        organizationId: req.user!.organizationId,
        ...(query.status ? { status: query.status as never } : {}),
        ...(query.search ? { OR: [{ permanentCode: { contains: query.search } }, { testType: { contains: query.search } }, { qualitativeResult: { contains: query.search } }] } : {})
      },
      orderBy: { testedAt: "desc" },
      include: { sample: true, method: true, instrument: true, evidenceDocument: true }
    });
    return res.json({ tests });
  } catch (error) {
    return next(error);
  }
});

limsRouter.post("/tests", async (req, res, next) => {
  try {
    const input = createLabTestSchema.parse(req.body);
    const test = await createLabTest({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "lab_test", entityId: test.id, action: "lims_ensayo_creado", after: test });
    return res.status(201).json({ test });
  } catch (error) {
    return limsError(error, res, next);
  }
});

limsRouter.patch("/tests/:id/result", async (req, res, next) => {
  try {
    const input = updateLabResultSchema.parse(req.body);
    const before = await prisma.labTest.findFirstOrThrow({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    const test = await updateLabResult({ organizationId: req.user!.organizationId, userId: req.user!.id, testId: req.params.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "lab_test", entityId: test.id, action: "lims_resultado_actualizado", before, after: test });
    return res.json({ test });
  } catch (error) {
    return limsError(error, res, next);
  }
});

limsRouter.post("/tests/:id/invalidate", async (req, res, next) => {
  try {
    const input = invalidateLabTestSchema.parse(req.body);
    const test = await invalidateLabTest({ organizationId: req.user!.organizationId, userId: req.user!.id, testId: req.params.id, reason: input.reason });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "lab_test", entityId: test.id, action: "lims_resultado_invalidado", after: test });
    return res.json({ test });
  } catch (error) {
    return limsError(error, res, next);
  }
});

limsRouter.post("/tests/:id/repeat", async (req, res, next) => {
  try {
    const input = invalidateLabTestSchema.parse(req.body);
    const test = await repeatLabTest({ organizationId: req.user!.organizationId, userId: req.user!.id, testId: req.params.id, reason: input.reason });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "lab_test", entityId: test.id, action: "lims_ensayo_repetido", after: test });
    return res.status(201).json({ test });
  } catch (error) {
    return limsError(error, res, next);
  }
});

limsRouter.get("/stability", async (req, res, next) => {
  try {
    const studies = await prisma.labStabilityStudy.findMany({ where: { organizationId: req.user!.organizationId }, include: { sample: true, points: { include: { test: true } } }, orderBy: { updatedAt: "desc" } });
    return res.json({ studies });
  } catch (error) {
    return next(error);
  }
});

limsRouter.get("/non-conformities", async (req, res, next) => {
  try {
    const items = await prisma.labNonConformity.findMany({ where: { organizationId: req.user!.organizationId }, include: { sample: true, test: true, instrument: true, method: true }, orderBy: { createdAt: "desc" } });
    return res.json({ nonConformities: items });
  } catch (error) {
    return next(error);
  }
});

limsRouter.post("/samples/:id/release", async (req, res, next) => {
  try {
    const input = releaseSampleSchema.parse(req.body);
    const release = await releaseSample({ organizationId: req.user!.organizationId, userId: req.user!.id, sampleId: req.params.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "lab_technical_release", entityId: release.id, action: "lims_liberacion_tecnica", after: release });
    return res.status(201).json({ release });
  } catch (error) {
    return limsError(error, res, next);
  }
});
