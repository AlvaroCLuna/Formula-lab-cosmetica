import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { recordAudit } from "../services/audit.service.js";
import { buildRawMaterialIntelligence, buildRawMaterialSnapshot, buildRawMaterialWhere, generateRawMaterialCode, getRawMaterialDetail, isEditableRawMaterialVersion } from "../services/raw-materials.service.js";
import { commercialProductSchema, createRawMaterialSchema, listRawMaterialsSchema, rawMaterialDocumentSchema, relationSchema, updateRawMaterialVersionSchema } from "../validators/raw-materials.schemas.js";

export const rawMaterialsRouter = Router();

rawMaterialsRouter.use(requireAuth);

rawMaterialsRouter.get("/", async (req, res, next) => {
  try {
    const query = listRawMaterialsSchema.parse(req.query);
    const rawMaterials = await prisma.rawMaterialMaster.findMany({
      where: buildRawMaterialWhere({ organizationId: req.user!.organizationId, ...query }),
      orderBy: { updatedAt: "desc" },
      include: {
        versions: { orderBy: { versionNumber: "desc" }, take: 1 },
        suppliers: { where: { status: "activo" } },
        documents: { where: { status: "activo" } },
        ingredients: { where: { status: "activo" } }
      }
    });
    const enriched = rawMaterials.map((material) => ({
      ...material,
      intelligence: {
        formulationCount: new Set(material.ingredients.map((ingredient) => ingredient.formulationVersionId)).size,
        supplierCount: material.suppliers.length,
        documentCount: material.documents.length,
        lastUpdatedAt: material.updatedAt
      }
    }));
    return res.json({ rawMaterials: enriched });
  } catch (error) {
    return next(error);
  }
});

rawMaterialsRouter.post("/", async (req, res, next) => {
  try {
    const input = createRawMaterialSchema.parse(req.body);
    const permanentCode = await generateRawMaterialCode(req.user!.organizationId);
    const material = await prisma.rawMaterialMaster.create({
      data: {
        organizationId: req.user!.organizationId,
        permanentCode,
        commercialName: input.commercialName,
        commonName: input.commonName,
        inci: input.inci,
        cas: input.cas,
        ec: input.ec,
        category: input.category,
        family: input.family,
        cosmeticFunction: input.cosmeticFunction,
        status: "borrador",
        createdByUserId: req.user!.id,
        versions: {
          create: {
            organizationId: req.user!.organizationId,
            versionNumber: 1,
            status: "borrador",
            ...input,
            category: input.category,
            cosmeticFunction: input.cosmeticFunction,
            confidenceLevel: input.confidenceLevel ?? "pendiente",
            createdByUserId: req.user!.id
          }
        }
      },
      include: { versions: { orderBy: { versionNumber: "desc" } } }
    });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "raw_material_master", entityId: material.id, action: "materia_prima_creada", after: material });
    return res.status(201).json({ rawMaterial: material });
  } catch (error) {
    return next(error);
  }
});

rawMaterialsRouter.get("/:id", async (req, res, next) => {
  try {
    const rawMaterial = await getRawMaterialDetail(req.params.id, req.user!.organizationId);
    return res.json({ rawMaterial, intelligence: buildRawMaterialIntelligence(rawMaterial) });
  } catch (error) {
    return next(error);
  }
});

rawMaterialsRouter.get("/:id/quick-view", async (req, res, next) => {
  try {
    const rawMaterial = await getRawMaterialDetail(req.params.id, req.user!.organizationId);
    const version = rawMaterial.versions[0];
    return res.json({
      rawMaterial,
      intelligence: buildRawMaterialIntelligence(rawMaterial),
      learning: {
        name: rawMaterial.commonName,
        inci: rawMaterial.inci ?? "Informacion insuficiente para evaluar.",
        function: rawMaterial.cosmeticFunction ?? "Informacion insuficiente para evaluar.",
        description: version?.description ?? "Informacion insuficiente para evaluar.",
        examplesOfUse: version?.examplesOfUse ?? "Informacion insuficiente para evaluar.",
        formulations: buildRawMaterialIntelligence(rawMaterial).formulations
      }
    });
  } catch (error) {
    return next(error);
  }
});

rawMaterialsRouter.patch("/versions/:id", async (req, res, next) => {
  try {
    const input = updateRawMaterialVersionSchema.parse(req.body);
    const before = await prisma.rawMaterialMasterVersion.findFirstOrThrow({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    if (!isEditableRawMaterialVersion(before)) {
      return res.status(409).json({ message: "Esta ficha validada es inmutable. Crea una nueva version para modificarla." });
    }
    const after = await prisma.rawMaterialMasterVersion.update({ where: { id: before.id }, data: input });
    await prisma.rawMaterialMaster.update({
      where: { id: before.rawMaterialMasterId },
      data: {
        commercialName: after.commercialName,
        commonName: after.commonName,
        inci: after.inci,
        cas: after.cas,
        ec: after.ec,
        category: after.category,
        family: after.family,
        cosmeticFunction: after.cosmeticFunction
      }
    });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "raw_material_master_version", entityId: after.id, action: "materia_prima_editada", before, after });
    return res.json({ version: after });
  } catch (error) {
    return next(error);
  }
});

rawMaterialsRouter.post("/versions/:id/submit-review", async (req, res, next) => {
  try {
    const before = await prisma.rawMaterialMasterVersion.findFirstOrThrow({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    if (!isEditableRawMaterialVersion(before)) return res.status(409).json({ message: "Esta ficha no puede enviarse a revision." });
    const after = await prisma.rawMaterialMasterVersion.update({ where: { id: before.id }, data: { status: "en_revision" } });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "raw_material_master_version", entityId: after.id, action: "materia_prima_enviada_revision", before, after });
    return res.json({ version: after });
  } catch (error) {
    return next(error);
  }
});

rawMaterialsRouter.post("/versions/:id/approve", async (req, res, next) => {
  try {
    const before = await prisma.rawMaterialMasterVersion.findFirstOrThrow({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    if (!isEditableRawMaterialVersion(before)) return res.status(409).json({ message: "Esta ficha ya es inmutable." });
    const snapshot = buildRawMaterialSnapshot(before);
    const after = await prisma.rawMaterialMasterVersion.update({
      where: { id: before.id },
      data: { status: "validada", approvedByUserId: req.user!.id, approvedAt: new Date(), snapshotJson: snapshot }
    });
    await prisma.rawMaterialMaster.update({
      where: { id: before.rawMaterialMasterId },
      data: {
        status: "validada",
        currentVersionId: after.id,
        commercialName: after.commercialName,
        commonName: after.commonName,
        inci: after.inci,
        cas: after.cas,
        ec: after.ec,
        category: after.category,
        family: after.family,
        cosmeticFunction: after.cosmeticFunction
      }
    });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "raw_material_master_version", entityId: after.id, action: "materia_prima_aprobada", before, after });
    return res.json({ version: after, snapshot });
  } catch (error) {
    return next(error);
  }
});

rawMaterialsRouter.post("/:id/versions", async (req, res, next) => {
  try {
    const material = await prisma.rawMaterialMaster.findFirstOrThrow({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } }
    });
    const latest = material.versions[0];
    if (!latest || latest.status !== "validada") return res.status(409).json({ message: "Solo se puede crear nueva version desde una ficha validada." });
    const version = await prisma.rawMaterialMasterVersion.create({
      data: {
        organizationId: req.user!.organizationId,
        rawMaterialMasterId: material.id,
        versionNumber: latest.versionNumber + 1,
        status: "borrador",
        commercialName: latest.commercialName,
        commonName: latest.commonName,
        inci: latest.inci,
        cas: latest.cas,
        ec: latest.ec,
        category: latest.category,
        family: latest.family,
        cosmeticFunction: latest.cosmeticFunction,
        description: latest.description,
        appearance: latest.appearance,
        color: latest.color,
        odor: latest.odor,
        solubility: latest.solubility,
        density: latest.density,
        ph: latest.ph,
        maxTemperature: latest.maxTemperature,
        recommendedTemperature: latest.recommendedTemperature,
        usageRange: latest.usageRange,
        storageConditions: latest.storageConditions,
        shelfLife: latest.shelfLife,
        contraindications: latest.contraindications,
        compatibilities: latest.compatibilities,
        incompatibilities: latest.incompatibilities,
        allergens: latest.allergens,
        observations: latest.observations,
        examplesOfUse: latest.examplesOfUse,
        evidenceSummary: latest.evidenceSummary,
        confidenceLevel: latest.confidenceLevel,
        createdByUserId: req.user!.id
      }
    });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "raw_material_master_version", entityId: version.id, action: "materia_prima_nueva_version", before: latest, after: version });
    return res.status(201).json({ version });
  } catch (error) {
    return next(error);
  }
});

rawMaterialsRouter.post("/:id/manufacturers", async (req, res, next) => {
  try {
    const input = relationSchema.parse(req.body);
    await prisma.rawMaterialMaster.findFirstOrThrow({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    const manufacturer = await prisma.rawMaterialManufacturer.create({ data: { organizationId: req.user!.organizationId, rawMaterialMasterId: req.params.id, name: input.name, country: input.country } });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "raw_material_manufacturer", entityId: manufacturer.id, action: "fabricante_agregado", after: manufacturer });
    return res.status(201).json({ manufacturer });
  } catch (error) {
    return next(error);
  }
});

rawMaterialsRouter.post("/:id/suppliers", async (req, res, next) => {
  try {
    const input = relationSchema.parse(req.body);
    await prisma.rawMaterialMaster.findFirstOrThrow({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    const supplier = await prisma.rawMaterialSupplier.create({ data: { organizationId: req.user!.organizationId, rawMaterialMasterId: req.params.id, name: input.name, contact: input.contact } });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "raw_material_supplier", entityId: supplier.id, action: "proveedor_agregado", after: supplier });
    return res.status(201).json({ supplier });
  } catch (error) {
    return next(error);
  }
});

rawMaterialsRouter.post("/:id/products", async (req, res, next) => {
  try {
    const input = commercialProductSchema.parse(req.body);
    await prisma.rawMaterialMaster.findFirstOrThrow({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    const product = await prisma.rawMaterialCommercialProduct.create({ data: { organizationId: req.user!.organizationId, rawMaterialMasterId: req.params.id, ...input } });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "raw_material_commercial_product", entityId: product.id, action: "producto_comercial_agregado", after: product });
    return res.status(201).json({ product });
  } catch (error) {
    return next(error);
  }
});

rawMaterialsRouter.post("/:id/documents", async (req, res, next) => {
  try {
    const input = rawMaterialDocumentSchema.parse(req.body);
    await prisma.rawMaterialMaster.findFirstOrThrow({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    if (input.documentId) {
      await prisma.document.findFirstOrThrow({ where: { id: input.documentId, organizationId: req.user!.organizationId } });
    }
    const document = await prisma.rawMaterialDocument.create({ data: { organizationId: req.user!.organizationId, rawMaterialMasterId: req.params.id, ...input } });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "raw_material_document", entityId: document.id, action: "documento_materia_prima_vinculado", after: document });
    return res.status(201).json({ document });
  } catch (error) {
    return next(error);
  }
});

rawMaterialsRouter.post("/:id/archive", async (req, res, next) => {
  try {
    const before = await prisma.rawMaterialMaster.findFirstOrThrow({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    const after = await prisma.rawMaterialMaster.update({ where: { id: before.id }, data: { status: "archivada" } });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "raw_material_master", entityId: after.id, action: "materia_prima_archivada", before, after });
    return res.json({ rawMaterial: after });
  } catch (error) {
    return next(error);
  }
});
