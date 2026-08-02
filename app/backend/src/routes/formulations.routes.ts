import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { recordAudit } from "../services/audit.service.js";
import { generatePermanentCode, listFormulations } from "../services/formulations.service.js";
import { compareFormulationVersions } from "../services/formulation-comparison.service.js";
import { buildVersionSnapshot, getVersionForOrganization, isEditableVersion, validateFormulationTotal } from "../services/formulation-versioning.service.js";
import { compareVersionsSchema, createFormulationSchema, ingredientSchema, listFormulationsSchema, updateVersionSchema } from "../validators/formulations.schemas.js";

export const formulationsRouter = Router();

formulationsRouter.use(requireAuth);

formulationsRouter.get("/", async (req, res, next) => {
  try {
    const query = listFormulationsSchema.parse(req.query);
    const formulations = await listFormulations({
      organizationId: req.user!.organizationId,
      search: query.search,
      status: query.status,
      category: query.category
    });
    return res.json({ formulations });
  } catch (error) {
    return next(error);
  }
});

formulationsRouter.post("/", async (req, res, next) => {
  try {
    const input = createFormulationSchema.parse(req.body);
    const permanentCode = await generatePermanentCode(req.user!.organizationId);
    const family = await prisma.formulationFamily.create({
      data: {
        organizationId: req.user!.organizationId,
        permanentCode,
        name: input.name,
        category: input.category,
        status: "en_desarrollo",
        createdByUserId: req.user!.id,
        versions: {
          create: {
            organizationId: req.user!.organizationId,
            versionNumber: 1,
            status: "borrador",
            name: input.name,
            category: input.category,
            objective: input.objective,
            notes: input.notes,
            createdByUserId: req.user!.id
          }
        }
      },
      include: { versions: { include: { ingredients: true } } }
    });
    await recordAudit({
      organizationId: req.user!.organizationId,
      userId: req.user!.id,
      entityType: "formulation_family",
      entityId: family.id,
      action: "formulacion_creada",
      after: family
    });
    return res.status(201).json({ formulation: family });
  } catch (error) {
    return next(error);
  }
});

formulationsRouter.get("/:id", async (req, res, next) => {
  try {
    const formulation = await prisma.formulationFamily.findFirstOrThrow({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          include: { ingredients: { where: { status: "activo" }, orderBy: { orderIndex: "asc" } } }
        }
      }
    });
    return res.json({ formulation });
  } catch (error) {
    return next(error);
  }
});

formulationsRouter.get("/:id/quick-view", async (req, res, next) => {
  try {
    const formulation = await prisma.formulationFamily.findFirstOrThrow({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
          include: { ingredients: { where: { status: "activo" }, orderBy: { orderIndex: "asc" }, include: { rawMaterialMaster: true } } }
        }
      }
    });
    const version = formulation.versions[0];
    return res.json({
      formulation,
      learningCards:
        version?.ingredients.map((ingredient) => ({
          name: ingredient.displayName,
          cosmeticFunction: ingredient.cosmeticFunction,
          inci: ingredient.inci ?? ingredient.rawMaterialMaster?.inci ?? "Información insuficiente para evaluar.",
          source: ingredient.rawMaterialMasterId ? "Materia prima maestra" : "Ingrediente provisional",
          confidence: ingredient.rawMaterialMasterId ? "alta" : "pendiente"
        })) ?? []
    });
  } catch (error) {
    return next(error);
  }
});

formulationsRouter.get("/:id/versions", async (req, res, next) => {
  try {
    const versions = await prisma.formulationVersion.findMany({
      where: { formulationFamilyId: req.params.id, organizationId: req.user!.organizationId },
      orderBy: { versionNumber: "desc" },
      include: { ingredients: { where: { status: "activo" }, orderBy: { orderIndex: "asc" } } }
    });
    return res.json({ versions });
  } catch (error) {
    return next(error);
  }
});

formulationsRouter.post("/:id/versions", async (req, res, next) => {
  try {
    const family = await prisma.formulationFamily.findFirstOrThrow({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1, include: { ingredients: { where: { status: "activo" } } } } }
    });
    const latest = family.versions[0];
    if (!latest || latest.status !== "aprobada") {
      return res.status(409).json({ message: "Solo se puede crear nueva versión desde una versión aprobada." });
    }
    const version = await prisma.formulationVersion.create({
      data: {
        organizationId: req.user!.organizationId,
        formulationFamilyId: family.id,
        versionNumber: latest.versionNumber + 1,
        status: "borrador",
        name: latest.name,
        category: latest.category,
        objective: latest.objective,
        notes: latest.notes,
        createdByUserId: req.user!.id,
        ingredients: {
          create: latest.ingredients.map((ingredient) => ({
            organizationId: req.user!.organizationId,
            rawMaterialMasterId: ingredient.rawMaterialMasterId,
            displayName: ingredient.displayName,
            inci: ingredient.inci,
            cosmeticFunction: ingredient.cosmeticFunction,
            phase: ingredient.phase,
            percentage: ingredient.percentage,
            baseQuantity: ingredient.baseQuantity,
            unit: ingredient.unit,
            orderIndex: ingredient.orderIndex,
            sourceType: ingredient.sourceType,
            sourceReference: ingredient.sourceReference,
            estimatedCost: ingredient.estimatedCost,
            productionNotes: ingredient.productionNotes,
            inventoryLockPolicy: ingredient.inventoryLockPolicy
          }))
        }
      },
      include: { ingredients: { orderBy: { orderIndex: "asc" } } }
    });
    await recordAudit({
      organizationId: req.user!.organizationId,
      userId: req.user!.id,
      entityType: "formulation_version",
      entityId: version.id,
      action: "nueva_version_creada",
      before: latest,
      after: version
    });
    return res.status(201).json({ version });
  } catch (error) {
    return next(error);
  }
});

formulationsRouter.get("/:id/compare", async (req, res, next) => {
  try {
    const input = compareVersionsSchema.parse(req.query);
    const base = await getVersionForOrganization(input.baseVersionId, req.user!.organizationId);
    const target = await getVersionForOrganization(input.targetVersionId, req.user!.organizationId);
    if (base.formulationFamilyId !== req.params.id || target.formulationFamilyId !== req.params.id) {
      return res.status(400).json({ message: "Las versiones deben pertenecer a la misma formulación." });
    }
    return res.json({ comparison: compareFormulationVersions(base, target) });
  } catch (error) {
    return next(error);
  }
});

formulationsRouter.post("/:id/compare", async (req, res, next) => {
  try {
    const input = compareVersionsSchema.parse(req.body);
    const base = await getVersionForOrganization(input.baseVersionId, req.user!.organizationId);
    const target = await getVersionForOrganization(input.targetVersionId, req.user!.organizationId);
    if (base.formulationFamilyId !== req.params.id || target.formulationFamilyId !== req.params.id) {
      return res.status(400).json({ message: "Las versiones deben pertenecer a la misma formulación." });
    }
    const summary = compareFormulationVersions(base, target);
    const saved = await prisma.formulationVersionComparison.create({
      data: {
        organizationId: req.user!.organizationId,
        baseVersionId: base.id,
        targetVersionId: target.id,
        summaryJson: summary,
        createdByUserId: req.user!.id
      }
    });
    await recordAudit({
      organizationId: req.user!.organizationId,
      userId: req.user!.id,
      entityType: "formulation_version_comparison",
      entityId: saved.id,
      action: "comparacion_guardada",
      after: summary
    });
    return res.status(201).json({ comparison: summary, saved });
  } catch (error) {
    return next(error);
  }
});

formulationsRouter.patch("/versions/:id", async (req, res, next) => {
  try {
    const input = updateVersionSchema.parse(req.body);
    const before = await getVersionForOrganization(req.params.id, req.user!.organizationId);
    if (!isEditableVersion(before)) {
      return res.status(409).json({ message: "Esta version es inmutable. Crea una nueva version para modificarla." });
    }
    const after = await prisma.formulationVersion.update({
      where: { id: before.id },
      data: input,
      include: { ingredients: { orderBy: { orderIndex: "asc" } } }
    });
    await prisma.formulationFamily.update({
      where: { id: before.formulationFamilyId },
      data: { name: after.name, category: after.category }
    });
    await recordAudit({
      organizationId: req.user!.organizationId,
      userId: req.user!.id,
      entityType: "formulation_version",
      entityId: after.id,
      action: "version_editada",
      before,
      after
    });
    return res.json({ version: after });
  } catch (error) {
    return next(error);
  }
});

formulationsRouter.post("/versions/:id/submit-review", async (req, res, next) => {
  try {
    const before = await getVersionForOrganization(req.params.id, req.user!.organizationId);
    if (!isEditableVersion(before)) {
      return res.status(409).json({ message: "Esta version es inmutable. Crea una nueva version para modificarla." });
    }
    const after = await prisma.formulationVersion.update({ where: { id: before.id }, data: { status: "en_revision" }, include: { ingredients: { where: { status: "activo" } } } });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "formulation_version", entityId: after.id, action: "version_enviada_revision", before, after });
    return res.json({ version: after });
  } catch (error) {
    return next(error);
  }
});

formulationsRouter.post("/versions/:id/approve", async (req, res, next) => {
  try {
    const before = await getVersionForOrganization(req.params.id, req.user!.organizationId);
    if (!isEditableVersion(before)) {
      return res.status(409).json({ message: "Esta version es inmutable. Crea una nueva version para modificarla." });
    }
    const validation = validateFormulationTotal(before.ingredients);
    if (before.ingredients.length === 0) {
      return res.status(409).json({ message: "No se puede aprobar una formulación sin ingredientes." });
    }
    if (!validation.isValid) {
      return res.status(409).json({ message: `El total porcentual debe ser 100%. Total actual: ${validation.total}%.` });
    }
    const snapshot = buildVersionSnapshot(before);
    const after = await prisma.formulationVersion.update({
      where: { id: before.id },
      data: { status: "aprobada", approvedByUserId: req.user!.id, approvedAt: new Date(), snapshotJson: snapshot },
      include: { ingredients: { orderBy: { orderIndex: "asc" } } }
    });
    await prisma.formulationFamily.update({
      where: { id: before.formulationFamilyId },
      data: { currentVersionId: after.id, status: "activa", name: after.name, category: after.category }
    });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "formulation_version", entityId: after.id, action: "version_aprobada", before, after });
    return res.json({ version: after, snapshot });
  } catch (error) {
    return next(error);
  }
});

formulationsRouter.post("/versions/:id/reject", async (req, res, next) => {
  try {
    const before = await getVersionForOrganization(req.params.id, req.user!.organizationId);
    if (!isEditableVersion(before)) {
      return res.status(409).json({ message: "Esta version es inmutable. Crea una nueva version para modificarla." });
    }
    const after = await prisma.formulationVersion.update({ where: { id: before.id }, data: { status: "rechazada" }, include: { ingredients: { where: { status: "activo" } } } });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "formulation_version", entityId: after.id, action: "version_rechazada", before, after });
    return res.json({ version: after });
  } catch (error) {
    return next(error);
  }
});

formulationsRouter.post("/versions/:id/ingredients", async (req, res, next) => {
  try {
    const input = ingredientSchema.parse(req.body);
    const version = await getVersionForOrganization(req.params.id, req.user!.organizationId);
    if (!isEditableVersion(version)) {
      return res.status(409).json({ message: "Esta version es inmutable. Crea una nueva version para modificarla." });
    }
    const rawMaterial = input.rawMaterialMasterId
      ? await prisma.rawMaterialMaster.findFirst({ where: { id: input.rawMaterialMasterId, organizationId: req.user!.organizationId } })
      : null;
    if (input.rawMaterialMasterId && !rawMaterial) {
      return res.status(404).json({ message: "Materia prima maestra no encontrada en esta organización." });
    }
    const ingredient = await prisma.formulationIngredient.create({
      data: {
        organizationId: req.user!.organizationId,
        formulationVersionId: version.id,
        rawMaterialMasterId: rawMaterial?.id,
        displayName: input.displayName,
        inci: input.inci ?? rawMaterial?.inci,
        cosmeticFunction: input.cosmeticFunction,
        phase: input.phase,
        percentage: input.percentage,
        baseQuantity: input.baseQuantity,
        unit: input.unit,
        orderIndex: input.orderIndex,
        sourceType: rawMaterial ? "materia_prima_maestra" : "provisional",
        sourceReference: input.sourceReference ?? (rawMaterial ? rawMaterial.permanentCode : "Ingrediente provisional"),
        status: "activo"
      }
    });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "formulation_ingredient", entityId: ingredient.id, action: "ingrediente_agregado", after: ingredient });
    return res.status(201).json({ ingredient });
  } catch (error) {
    return next(error);
  }
});

formulationsRouter.patch("/ingredients/:id", async (req, res, next) => {
  try {
    const input = ingredientSchema.partial().parse(req.body);
    const before = await prisma.formulationIngredient.findFirstOrThrow({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: { version: true }
    });
    if (!isEditableVersion(before.version)) {
      return res.status(409).json({ message: "Esta version es inmutable. Crea una nueva version para modificarla." });
    }
    const after = await prisma.formulationIngredient.update({
      where: { id: before.id },
      data: input,
      include: { rawMaterialMaster: true }
    });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "formulation_ingredient", entityId: after.id, action: "ingrediente_editado", before, after });
    return res.json({ ingredient: after });
  } catch (error) {
    return next(error);
  }
});

formulationsRouter.delete("/ingredients/:id", async (req, res, next) => {
  try {
    const before = await prisma.formulationIngredient.findFirstOrThrow({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: { version: true }
    });
    if (!isEditableVersion(before.version)) {
      return res.status(409).json({ message: "Esta version es inmutable. Crea una nueva version para modificarla." });
    }
    const after = await prisma.formulationIngredient.update({ where: { id: before.id }, data: { status: "archivado" } });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "formulation_ingredient", entityId: before.id, action: "ingrediente_archivado", before, after });
    return res.json({ ingredient: after });
  } catch (error) {
    return next(error);
  }
});

formulationsRouter.get("/catalog/raw-materials", async (req, res, next) => {
  try {
    const rawMaterials = await prisma.rawMaterialMaster.findMany({
      where: { organizationId: req.user!.organizationId, status: "activo" },
      orderBy: { commonName: "asc" }
    });
    return res.json({ rawMaterials });
  } catch (error) {
    return next(error);
  }
});
