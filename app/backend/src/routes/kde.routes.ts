import fs from "node:fs";
import multer from "multer";
import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { assertAllowedKdeFile, ensureStorageFolders } from "../services/storage.service.js";
import { addDocumentVersion, createKdeDocument, getKdeDocument, kdeDashboard, nextPermanentCode, searchKdeDocuments } from "../services/kde.service.js";
import { documentRelationSchema, documentTagSchema, documentVersionSchema, kdeSearchSchema } from "../validators/kde.schemas.js";
import { recordAudit } from "../services/audit.service.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 80 * 1024 * 1024 } });

export const kdeRouter = Router();

kdeRouter.use(requireAuth);

kdeRouter.get("/dashboard", async (req, res, next) => {
  try {
    return res.json({ indicators: await kdeDashboard(req.user!.organizationId) });
  } catch (error) {
    return next(error);
  }
});

kdeRouter.get("/types", async (req, res, next) => {
  try {
    const types = await prisma.kdeDocumentType.findMany({ where: { organizationId: req.user!.organizationId, status: "activo" }, orderBy: [{ category: "asc" }, { name: "asc" }] });
    return res.json({ types });
  } catch (error) {
    return next(error);
  }
});

kdeRouter.get("/tags", async (req, res, next) => {
  try {
    const tags = await prisma.documentTag.findMany({ where: { organizationId: req.user!.organizationId, status: "activo" }, orderBy: { name: "asc" } });
    return res.json({ tags });
  } catch (error) {
    return next(error);
  }
});

kdeRouter.get("/documents", async (req, res, next) => {
  try {
    const filters = kdeSearchSchema.parse(req.query);
    const documents = await searchKdeDocuments(req.user!.organizationId, filters);
    return res.json({ documents });
  } catch (error) {
    return next(error);
  }
});

kdeRouter.post("/documents", upload.array("files", 12), async (req, res, next) => {
  try {
    await ensureStorageFolders();
    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length === 0) return res.status(400).json({ message: "Selecciona al menos un documento." });
    const uploaded = [];
    for (const file of files) {
      const extension = assertAllowedKdeFile(file.originalname);
      const result = await createKdeDocument({ organizationId: req.user!.organizationId, userId: req.user!.id, file, extension });
      await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "kde_document", entityId: result.document.id, action: "kde_documento_cargado", after: result.document });
      uploaded.push(result.document);
    }
    return res.status(201).json({ documents: uploaded });
  } catch (error) {
    return next(error);
  }
});

kdeRouter.get("/documents/:id", async (req, res, next) => {
  try {
    const document = await getKdeDocument(req.user!.organizationId, req.params.id);
    return res.json({ document });
  } catch (error) {
    return next(error);
  }
});

kdeRouter.get("/documents/:id/preview", async (req, res, next) => {
  try {
    const document = await prisma.document.findFirstOrThrow({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    if (!["pdf", "txt", "csv", "png", "jpg", "jpeg", "webp"].includes(document.fileExtension)) {
      return res.status(415).json({ message: "Vista previa integrada no disponible para este formato." });
    }
    if (!fs.existsSync(document.storagePath)) return res.status(404).json({ message: "Archivo no encontrado en almacenamiento." });
    return res.sendFile(document.storagePath);
  } catch (error) {
    return next(error);
  }
});

kdeRouter.post("/documents/:id/versions", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Selecciona el archivo de la nueva version." });
    const input = documentVersionSchema.parse(req.body);
    const extension = assertAllowedKdeFile(req.file.originalname);
    const documentId = String(req.params.id);
    const version = await addDocumentVersion({ organizationId: req.user!.organizationId, userId: req.user!.id, documentId, file: req.file, extension, changeReason: String(input.changeReason) });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "document_version", entityId: version.id, action: "kde_version_creada", after: version });
    return res.status(201).json({ version });
  } catch (error) {
    return next(error);
  }
});

kdeRouter.post("/documents/:id/relations", async (req, res, next) => {
  try {
    await prisma.document.findFirstOrThrow({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    const input = documentRelationSchema.parse(req.body);
    const relation = await prisma.documentRelation.create({ data: { organizationId: req.user!.organizationId, documentId: req.params.id, createdByUserId: req.user!.id, ...input } });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "document_relation", entityId: relation.id, action: "kde_relacion_creada", after: relation });
    return res.status(201).json({ relation });
  } catch (error) {
    return next(error);
  }
});

kdeRouter.post("/documents/:id/tags", async (req, res, next) => {
  try {
    await prisma.document.findFirstOrThrow({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    const input = documentTagSchema.parse(req.body);
    const tag = await prisma.documentTag.upsert({
      where: { organizationId_name: { organizationId: req.user!.organizationId, name: input.name } },
      update: { color: input.color },
      create: { organizationId: req.user!.organizationId, permanentCode: await nextPermanentCode("TAG", req.user!.organizationId), name: input.name, color: input.color }
    });
    const link = await prisma.documentTagLink.upsert({
      where: { documentId_tagId: { documentId: req.params.id, tagId: tag.id } },
      update: {},
      create: { organizationId: req.user!.organizationId, documentId: req.params.id, tagId: tag.id }
    });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "document_tag", entityId: tag.id, action: "kde_etiqueta_asignada", after: { tag, link } });
    return res.status(201).json({ tag, link });
  } catch (error) {
    return next(error);
  }
});
