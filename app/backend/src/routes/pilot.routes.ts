import { Router } from "express";
import multer from "multer";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { recordAudit } from "../services/audit.service.js";
import { commitPilotImport, createPilotExperimentalVersion, createPilotProduct, createPilotTrial, finishPilotTrial, listPilotProducts, listPilotTrials, pilotDashboard, pilotMode, pilotTrialWorksheet, previewPilotImport, recordPilotParameter } from "../services/pilot.service.js";
import { createExperimentalVersionSchema, createPilotProductSchema, createPilotTrialSchema, finishPilotTrialSchema, pilotImportKindSchema, recordPilotParameterSchema } from "../validators/pilot.schemas.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { files: 12, fileSize: 15 * 1024 * 1024 } });

export const pilotRouter = Router();
pilotRouter.use(requireAuth);

pilotRouter.get("/mode", (_req, res) => res.json(pilotMode()));

pilotRouter.get("/dashboard", async (req, res, next) => {
  try {
    return res.json(await pilotDashboard(req.user!.organizationId));
  } catch (error) {
    return next(error);
  }
});

pilotRouter.get("/products", async (req, res, next) => {
  try {
    return res.json({ products: await listPilotProducts(req.user!.organizationId) });
  } catch (error) {
    return next(error);
  }
});

pilotRouter.post("/products", async (req, res, next) => {
  try {
    const product = await createPilotProduct(req.user!.organizationId, createPilotProductSchema.parse(req.body));
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "pilot_product", entityId: product.id, action: "producto_piloto_creado", after: product });
    return res.status(201).json({ product });
  } catch (error) {
    return next(error);
  }
});

pilotRouter.get("/imports", async (req, res, next) => {
  try {
    const imports = await prisma.pilotImportBatch.findMany({ where: { organizationId: req.user!.organizationId }, include: { items: true }, orderBy: { createdAt: "desc" }, take: 50 });
    return res.json({ imports });
  } catch (error) {
    return next(error);
  }
});

pilotRouter.post("/imports/preview", upload.array("files"), async (req, res, next) => {
  try {
    const importKind = pilotImportKindSchema.parse(req.body.importKind ?? "shampoo_solido_legacy");
    const result = await previewPilotImport(req.user!.organizationId, req.user!.id, importKind, (req.files as Express.Multer.File[]) ?? []);
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "pilot_import_batch", entityId: result.batch.id, action: "importacion_piloto_previsualizada", after: result.summary });
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
});

pilotRouter.post("/imports/:id/commit", async (req, res, next) => {
  try {
    const batch = await commitPilotImport(req.user!.organizationId, req.params.id);
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "pilot_import_batch", entityId: batch.id, action: "importacion_piloto_confirmada", after: batch });
    return res.json({ batch });
  } catch (error) {
    return next(error);
  }
});

pilotRouter.get("/trials", async (req, res, next) => {
  try {
    return res.json({ trials: await listPilotTrials(req.user!.organizationId) });
  } catch (error) {
    return next(error);
  }
});

pilotRouter.post("/trials", async (req, res, next) => {
  try {
    const trial = await createPilotTrial(req.user!.organizationId, req.user!.id, createPilotTrialSchema.parse(req.body));
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "pilot_lab_trial", entityId: trial.id, action: "prueba_piloto_creada", after: trial });
    return res.status(201).json({ trial });
  } catch (error) {
    return next(error);
  }
});

pilotRouter.get("/trials/:id/worksheet", async (req, res, next) => {
  try {
    return res.json(await pilotTrialWorksheet(req.user!.organizationId, req.params.id));
  } catch (error) {
    return next(error);
  }
});

pilotRouter.post("/trials/:id/parameters", async (req, res, next) => {
  try {
    const parameter = await recordPilotParameter(req.user!.organizationId, req.user!.id, req.params.id, recordPilotParameterSchema.parse(req.body));
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "pilot_lab_trial_parameter", entityId: parameter.id, action: "parametro_prueba_piloto_registrado", after: parameter });
    return res.status(201).json({ parameter });
  } catch (error) {
    return next(error);
  }
});

pilotRouter.post("/trials/:id/result", async (req, res, next) => {
  try {
    const trial = await finishPilotTrial(req.user!.organizationId, req.params.id, finishPilotTrialSchema.parse(req.body));
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "pilot_lab_trial", entityId: trial.id, action: "resultado_prueba_piloto_registrado", after: trial });
    return res.json({ trial });
  } catch (error) {
    return next(error);
  }
});

pilotRouter.post("/trials/:id/experimental-version", async (req, res, next) => {
  try {
    const input = createExperimentalVersionSchema.parse(req.body);
    const experimentalVersion = await createPilotExperimentalVersion(req.user!.organizationId, req.user!.id, req.params.id, input.changeSummary);
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "pilot_experimental_version", entityId: experimentalVersion.id, action: "version_experimental_piloto_preparada", after: experimentalVersion });
    return res.status(201).json({ experimentalVersion });
  } catch (error) {
    return next(error);
  }
});
