import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { recordAudit } from "../services/audit.service.js";
import { draftActionSchema, updateExtractedValueSchema } from "../validators/documents.schemas.js";

export const draftsRouter = Router();

draftsRouter.use(requireAuth);

draftsRouter.get("/latest", async (req, res, next) => {
  try {
    const draft = await prisma.rawMaterialDraft.findFirst({
      where: { organizationId: req.user!.organizationId },
      orderBy: { createdAt: "desc" },
      include: { extractedValues: { include: { document: true } }, versions: true }
    });
    return res.json({ draft });
  } catch (error) {
    return next(error);
  }
});

draftsRouter.patch("/values/:id", async (req, res, next) => {
  try {
    const input = updateExtractedValueSchema.parse(req.body);
    const before = await prisma.extractedValue.findFirstOrThrow({
      where: { id: req.params.id, organizationId: req.user!.organizationId }
    });
    const after = await prisma.extractedValue.update({
      where: { id: before.id },
      data: { value: input.value, validationStatus: input.validationStatus }
    });
    await recordAudit({
      organizationId: req.user!.organizationId,
      userId: req.user!.id,
      entityType: "extracted_value",
      entityId: after.id,
      action: "valor_corregido",
      before,
      after
    });
    return res.json({ value: after });
  } catch (error) {
    return next(error);
  }
});

draftsRouter.post("/:id/actions", async (req, res, next) => {
  try {
    const input = draftActionSchema.parse(req.body);
    const draft = await prisma.rawMaterialDraft.findFirstOrThrow({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: { extractedValues: true, versions: true }
    });

    if (input.action === "guardar_borrador") {
      await recordAudit({
        organizationId: req.user!.organizationId,
        userId: req.user!.id,
        entityType: "raw_material_draft",
        entityId: draft.id,
        action: "borrador_guardado",
        after: draft
      });
      return res.json({ draft });
    }

    if (input.action === "rechazar") {
      const updated = await prisma.rawMaterialDraft.update({ where: { id: draft.id }, data: { status: "rechazado" } });
      await recordAudit({
        organizationId: req.user!.organizationId,
        userId: req.user!.id,
        entityType: "raw_material_draft",
        entityId: draft.id,
        action: "ficha_rechazada",
        before: draft,
        after: updated
      });
      return res.json({ draft: updated });
    }

    const versionNumber = draft.versions.length + 1;
    const version = await prisma.rawMaterialValidatedVersion.create({
      data: {
        organizationId: req.user!.organizationId,
        draftId: draft.id,
        versionNumber,
        approvedByUserId: req.user!.id,
        snapshotJson: {
          draftId: draft.id,
          values: draft.extractedValues,
          approvedAt: new Date().toISOString()
        }
      }
    });
    const updated = await prisma.rawMaterialDraft.update({
      where: { id: draft.id },
      data: { status: "aprobado", approvedVersionId: version.id }
    });
    await recordAudit({
      organizationId: req.user!.organizationId,
      userId: req.user!.id,
      entityType: "raw_material_draft",
      entityId: draft.id,
      action: "ficha_aprobada",
      before: draft,
      after: { updated, version }
    });
    return res.json({ draft: updated, version });
  } catch (error) {
    return next(error);
  }
});
