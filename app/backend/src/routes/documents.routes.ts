import fs from "node:fs/promises";
import multer from "multer";
import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { assertAllowedFile, createStoredFilename, ensureStorageFolders, incomingPath } from "../services/storage.service.js";
import { extractDocument } from "../services/extraction.service.js";
import { recordAudit } from "../services/audit.service.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

export const documentsRouter = Router();

documentsRouter.use(requireAuth);

documentsRouter.get("/", async (req, res, next) => {
  try {
    const documents = await prisma.document.findMany({
      where: { organizationId: req.user!.organizationId },
      orderBy: { createdAt: "desc" },
      include: { extractedValues: true }
    });
    return res.json({ documents });
  } catch (error) {
    return next(error);
  }
});

documentsRouter.post("/", upload.array("files", 10), async (req, res, next) => {
  try {
    await ensureStorageFolders();
    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length === 0) {
      return res.status(400).json({ message: "Selecciona al menos un archivo." });
    }

    const uploaded = [];

    for (const file of files) {
      let extension = "";
      try {
        extension = assertAllowedFile(file.originalname, file.mimetype);
      } catch (error) {
        const rejected = await prisma.document.create({
          data: {
            organizationId: req.user!.organizationId,
            uploadedByUserId: req.user!.id,
            originalFilename: file.originalname,
            storedFilename: "rechazado",
            mimeType: file.mimetype,
            fileExtension: "desconocido",
            sizeBytes: file.size,
            storagePath: "storage/rejected",
            status: "rechazado",
            rejectionReason: error instanceof Error ? error.message : "Archivo rechazado."
          }
        });
        uploaded.push(rejected);
        continue;
      }

      const storedFilename = createStoredFilename(file.originalname);
      const storagePath = incomingPath(storedFilename);
      await fs.writeFile(storagePath, file.buffer);

      const draft = await prisma.rawMaterialDraft.create({
        data: {
          organizationId: req.user!.organizationId,
          createdByUserId: req.user!.id,
          status: "borrador"
        }
      });

      const document = await prisma.document.create({
        data: {
          organizationId: req.user!.organizationId,
          uploadedByUserId: req.user!.id,
          originalFilename: file.originalname,
          storedFilename,
          mimeType: file.mimetype,
          fileExtension: extension,
          sizeBytes: file.size,
          storagePath,
          status: "pendiente"
        }
      });

      const job = await prisma.documentProcessingJob.create({
        data: {
          organizationId: req.user!.organizationId,
          documentId: document.id,
          status: "procesando",
          startedAt: new Date()
        }
      });

      await prisma.document.update({ where: { id: document.id }, data: { status: "procesando" } });

      try {
        const candidates = await extractDocument(storagePath, extension);
        await prisma.extractedValue.createMany({
          data: candidates.map((candidate) => ({
            organizationId: req.user!.organizationId,
            draftId: draft.id,
            documentId: document.id,
            fieldKey: candidate.fieldKey,
            fieldLabel: candidate.fieldLabel,
            value: candidate.value,
            sourceDocumentName: file.originalname,
            sourceReference: candidate.sourceReference,
            dataType: candidate.dataType,
            evidenceType: candidate.evidenceType,
            confidence: candidate.confidence,
            validationStatus: "pendiente"
          }))
        });

        const nextStatus = candidates.length > 0 ? "procesado" : "requiere_revision";
        const updatedDocument = await prisma.document.update({ where: { id: document.id }, data: { status: nextStatus } });
        await prisma.documentProcessingJob.update({ where: { id: job.id }, data: { status: "completado", finishedAt: new Date() } });
        await recordAudit({
          organizationId: req.user!.organizationId,
          userId: req.user!.id,
          entityType: "document",
          entityId: document.id,
          action: "documento_cargado",
          after: updatedDocument
        });
        uploaded.push(updatedDocument);
      } catch (error) {
        const updatedDocument = await prisma.document.update({
          where: { id: document.id },
          data: { status: "requiere_revision", rejectionReason: error instanceof Error ? error.message : "Error de extracción." }
        });
        await prisma.documentProcessingJob.update({
          where: { id: job.id },
          data: { status: "fallido", finishedAt: new Date(), errorMessage: updatedDocument.rejectionReason }
        });
        uploaded.push(updatedDocument);
      }
    }

    return res.status(201).json({ documents: uploaded });
  } catch (error) {
    return next(error);
  }
});
