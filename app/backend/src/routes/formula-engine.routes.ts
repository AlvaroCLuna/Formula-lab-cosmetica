import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { recordAudit } from "../services/audit.service.js";
import { calculateFormulaEngine, compareFormulaEngineVersions, validateFormulaEngine } from "../services/formula-engine.service.js";
import { getVersionForOrganization, isEditableVersion } from "../services/formulation-versioning.service.js";
import { compareEngineSchema, engineQuerySchema, moveIngredientSchema, phaseSchema, reorderPhasesSchema } from "../validators/formula-engine.schemas.js";

export const formulaEngineRouter = Router();

formulaEngineRouter.use(requireAuth);

async function ensureDefaultPhases(versionId: string, organizationId: string) {
  const existing = await prisma.formulationPhase.findMany({ where: { formulationVersionId: versionId, organizationId }, orderBy: { orderIndex: "asc" } });
  if (existing.length) return existing;
  const ingredients = await prisma.formulationIngredient.findMany({ where: { formulationVersionId: versionId, organizationId, status: "activo" }, orderBy: { orderIndex: "asc" } });
  const names = Array.from(new Set(ingredients.map((ingredient) => ingredient.phase || "A")));
  if (!names.length) names.push("A");
  await prisma.formulationPhase.createMany({
    data: names.map((name, index) => ({ organizationId, formulationVersionId: versionId, name, orderIndex: index + 1 })),
    skipDuplicates: true
  });
  return prisma.formulationPhase.findMany({ where: { formulationVersionId: versionId, organizationId }, orderBy: { orderIndex: "asc" } });
}

formulaEngineRouter.get("/versions/:id", async (req, res, next) => {
  try {
    const query = engineQuerySchema.parse(req.query);
    const version = await getVersionForOrganization(req.params.id, req.user!.organizationId);
    const phases = await ensureDefaultPhases(version.id, req.user!.organizationId);
    const calculation = calculateFormulaEngine(version.ingredients, query.batchSize);
    const validation = validateFormulaEngine(version.ingredients, phases);
    return res.json({ version, phases, calculation, validation });
  } catch (error) {
    return next(error);
  }
});

formulaEngineRouter.post("/versions/:id/phases", async (req, res, next) => {
  try {
    const input = phaseSchema.parse(req.body);
    const version = await getVersionForOrganization(req.params.id, req.user!.organizationId);
    if (!isEditableVersion(version)) return res.status(409).json({ message: "Esta version es inmutable. Crea una nueva version para modificarla." });
    const phase = await prisma.formulationPhase.create({
      data: { organizationId: req.user!.organizationId, formulationVersionId: version.id, name: input.name, orderIndex: input.orderIndex }
    });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "formula_engine_phase", entityId: phase.id, action: "fase_agregada", after: phase });
    return res.status(201).json({ phase });
  } catch (error) {
    return next(error);
  }
});

formulaEngineRouter.patch("/versions/:id/phases/reorder", async (req, res, next) => {
  try {
    const input = reorderPhasesSchema.parse(req.body);
    const version = await getVersionForOrganization(req.params.id, req.user!.organizationId);
    if (!isEditableVersion(version)) return res.status(409).json({ message: "Esta version es inmutable. Crea una nueva version para modificarla." });
    const before = await ensureDefaultPhases(version.id, req.user!.organizationId);
    await Promise.all(
      input.phases.map((phase) =>
        prisma.formulationPhase.updateMany({
          where: { formulationVersionId: version.id, organizationId: req.user!.organizationId, name: phase.name },
          data: { orderIndex: phase.orderIndex }
        })
      )
    );
    const after = await ensureDefaultPhases(version.id, req.user!.organizationId);
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "formula_engine_version", entityId: version.id, action: "fases_reordenadas", before, after });
    return res.json({ phases: after });
  } catch (error) {
    return next(error);
  }
});

formulaEngineRouter.patch("/ingredients/:id/move", async (req, res, next) => {
  try {
    const input = moveIngredientSchema.parse(req.body);
    const before = await prisma.formulationIngredient.findFirstOrThrow({ where: { id: req.params.id, organizationId: req.user!.organizationId }, include: { version: true } });
    if (!isEditableVersion(before.version)) return res.status(409).json({ message: "Esta version es inmutable. Crea una nueva version para modificarla." });
    await prisma.formulationPhase.upsert({
      where: { formulationVersionId_name: { formulationVersionId: before.formulationVersionId, name: input.phase } },
      update: {},
      create: { organizationId: req.user!.organizationId, formulationVersionId: before.formulationVersionId, name: input.phase, orderIndex: input.orderIndex }
    });
    const after = await prisma.formulationIngredient.update({ where: { id: before.id }, data: { phase: input.phase, orderIndex: input.orderIndex } });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "formulation_ingredient", entityId: after.id, action: "ingrediente_movido", before, after });
    return res.json({ ingredient: after });
  } catch (error) {
    return next(error);
  }
});

formulaEngineRouter.get("/compare", async (req, res, next) => {
  try {
    const input = compareEngineSchema.parse(req.query);
    const base = await getVersionForOrganization(input.baseVersionId, req.user!.organizationId);
    const target = await getVersionForOrganization(input.targetVersionId, req.user!.organizationId);
    if (base.formulationFamilyId !== target.formulationFamilyId) {
      return res.status(400).json({ message: "Las versiones deben pertenecer a la misma formulacion." });
    }
    return res.json({ comparison: compareFormulaEngineVersions(base.ingredients, target.ingredients) });
  } catch (error) {
    return next(error);
  }
});
