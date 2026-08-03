import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { recordAudit } from "../services/audit.service.js";
import { createExport, createReport, executiveDashboard, moduleDashboard } from "../services/bi.service.js";
import { biFiltersSchema, exportReportSchema, reportBuilderSchema } from "../validators/bi.schemas.js";

export const biRouter = Router();
biRouter.use(requireAuth);

biRouter.get("/executive", async (req, res, next) => {
  try {
    return res.json(await executiveDashboard(req.user!.organizationId));
  } catch (error) {
    return next(error);
  }
});

biRouter.get("/dashboards", async (req, res, next) => {
  try {
    const query = biFiltersSchema.parse(req.query);
    const dashboards = await prisma.biDashboard.findMany({ where: { organizationId: req.user!.organizationId, ...(query.module ? { module: query.module } : {}) }, orderBy: { updatedAt: "desc" } });
    return res.json({ dashboards, moduleDashboard: await moduleDashboard(req.user!.organizationId, query.module ?? "general") });
  } catch (error) {
    return next(error);
  }
});

biRouter.get("/reports", async (req, res, next) => {
  try {
    const reports = await prisma.biReport.findMany({ where: { organizationId: req.user!.organizationId }, include: { exports: true, schedules: true, createdBy: true }, orderBy: { updatedAt: "desc" } });
    return res.json({ reports });
  } catch (error) {
    return next(error);
  }
});

biRouter.post("/reports", async (req, res, next) => {
  try {
    const input = reportBuilderSchema.parse(req.body);
    const report = await createReport({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "bi_report", entityId: report.id, action: "bi_reporte_creado", after: report });
    return res.status(201).json({ report });
  } catch (error) {
    return next(error);
  }
});

biRouter.get("/snapshots", async (req, res, next) => {
  try {
    const snapshots = await prisma.biSnapshot.findMany({ where: { organizationId: req.user!.organizationId }, orderBy: { createdAt: "desc" } });
    return res.json({ snapshots });
  } catch (error) {
    return next(error);
  }
});

biRouter.get("/alerts", async (req, res, next) => {
  try {
    const alerts = await prisma.biExecutiveAlert.findMany({ where: { organizationId: req.user!.organizationId }, orderBy: { createdAt: "desc" } });
    return res.json({ alerts });
  } catch (error) {
    return next(error);
  }
});

biRouter.get("/exports", async (req, res, next) => {
  try {
    const exports = await prisma.biExport.findMany({ where: { organizationId: req.user!.organizationId }, include: { report: true, exportedBy: true }, orderBy: { createdAt: "desc" } });
    return res.json({ exports });
  } catch (error) {
    return next(error);
  }
});

biRouter.post("/exports", async (req, res, next) => {
  try {
    const input = exportReportSchema.parse(req.body);
    const exported = await createExport({ organizationId: req.user!.organizationId, userId: req.user!.id, ...input });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "bi_export", entityId: exported.id, action: "bi_exportacion_generada", after: exported });
    return res.status(201).json({ export: exported });
  } catch (error) {
    return next(error);
  }
});

biRouter.get("/schedules", async (req, res, next) => {
  try {
    const schedules = await prisma.biSchedule.findMany({ where: { organizationId: req.user!.organizationId }, include: { report: true, responsible: true }, orderBy: { createdAt: "desc" } });
    return res.json({ schedules });
  } catch (error) {
    return next(error);
  }
});
