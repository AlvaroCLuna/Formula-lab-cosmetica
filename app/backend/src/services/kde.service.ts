import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { Express } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { createStoredFilename, incomingPath } from "./storage.service.js";

const typeHints: Record<string, { code: string; category: string }> = {
  tds: { code: "TDS", category: "Tecnico" },
  sds: { code: "SDS", category: "Tecnico" },
  msds: { code: "MSDS", category: "Tecnico" },
  coa: { code: "COA", category: "Tecnico" },
  certificado: { code: "CERTIFICADO", category: "Tecnico" },
  cotizacion: { code: "COTIZACION", category: "Comercial" },
  precio: { code: "LISTA_PRECIOS", category: "Comercial" },
  catalogo: { code: "CATALOGO", category: "Comercial" },
  paper: { code: "PAPER", category: "Cientifico" },
  patente: { code: "PATENTE", category: "Cientifico" },
  iso: { code: "ISO", category: "Normativo" },
  nom: { code: "NOM", category: "Normativo" },
  procedimiento: { code: "PROCEDIMIENTO", category: "Produccion" },
  bitacora: { code: "BITACORA", category: "Produccion" },
  ensayo: { code: "ENSAYO", category: "Laboratorio" },
  estabilidad: { code: "ESTABILIDAD", category: "Laboratorio" }
};

export function detectDocumentType(filename: string) {
  const normalized = normalize(filename);
  const hit = Object.entries(typeHints).find(([hint]) => normalized.includes(hint));
  return hit?.[1].code ?? "DOCUMENTO_GENERAL";
}

export function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export async function nextPermanentCode(prefix: "DOC" | "KNW" | "SRC" | "TAG", organizationId: string) {
  const count = prefix === "DOC"
    ? await prisma.document.count({ where: { organizationId, permanentCode: { not: null } } })
    : prefix === "KNW"
      ? await prisma.document.count({ where: { organizationId, knowledgeCode: { not: null } } })
      : prefix === "SRC"
        ? await prisma.knowledgeSource.count({ where: { organizationId } })
        : await prisma.documentTag.count({ where: { organizationId } });
  return `${prefix}-${String(count + 1).padStart(6, "0")}`;
}

export async function checksum(buffer: Buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export async function createKdeDocument(input: { organizationId: string; userId: string; file: Express.Multer.File; extension: string }) {
  const storedFilename = createStoredFilename(input.file.originalname);
  const storagePath = incomingPath(storedFilename);
  await fs.writeFile(storagePath, input.file.buffer);
  const typeCode = detectDocumentType(input.file.originalname);
  const documentType = await prisma.kdeDocumentType.findFirst({ where: { organizationId: input.organizationId, code: typeCode } });
  const documentCode = await nextPermanentCode("DOC", input.organizationId);
  const knowledgeCode = await nextPermanentCode("KNW", input.organizationId);
  const sourceCode = await nextPermanentCode("SRC", input.organizationId);
  const text = await extractPreviewText(storagePath, input.extension, input.file.originalname);
  const document = await prisma.document.create({
    data: {
      organizationId: input.organizationId,
      uploadedByUserId: input.userId,
      permanentCode: documentCode,
      knowledgeCode,
      sourceCode,
      title: titleFromFilename(input.file.originalname),
      documentTypeId: documentType?.id,
      language: detectLanguage(text),
      author: detectAfterLabel(text, ["autor", "author"]),
      supplier: detectAfterLabel(text, ["proveedor", "supplier"]),
      manufacturer: detectAfterLabel(text, ["fabricante", "manufacturer"]),
      detectedEntity: detectAfterLabel(text, ["materia prima", "producto", "inci"]),
      keywordsJson: keywordList(input.file.originalname, text),
      summary: summarize(text, input.file.originalname),
      pageCount: input.extension === "pdf" ? Math.max(1, (text.match(/\f/g) ?? []).length + 1) : null,
      tableCount: input.extension === "csv" || input.extension === "xlsx" ? 1 : 0,
      imageCount: ["png", "jpg", "jpeg", "webp", "tiff"].includes(input.extension) ? 1 : 0,
      indexingStatus: "preparado",
      originalFilename: input.file.originalname,
      storedFilename,
      mimeType: input.file.mimetype || mimeByExtension(input.extension),
      fileExtension: input.extension,
      sizeBytes: input.file.size,
      storagePath,
      status: text ? "procesado" : "requiere_revision"
    }
  });
  const version = await prisma.documentVersion.create({
    data: {
      organizationId: input.organizationId,
      documentId: document.id,
      versionNumber: 1,
      originalFilename: input.file.originalname,
      storedFilename,
      mimeType: input.file.mimetype || mimeByExtension(input.extension),
      fileExtension: input.extension,
      sizeBytes: input.file.size,
      storagePath,
      checksumSha256: await checksum(input.file.buffer),
      changeReason: "Carga inicial en KDE",
      createdByUserId: input.userId
    }
  });
  await prisma.document.update({ where: { id: document.id }, data: { currentVersionId: version.id } });
  await createChunksAndOcr({ organizationId: input.organizationId, userId: input.userId, documentId: document.id, text, extension: input.extension, filename: input.file.originalname });
  const source = await prisma.knowledgeSource.create({
    data: { organizationId: input.organizationId, permanentCode: sourceCode, documentId: document.id, sourceType: "documento", title: titleFromFilename(input.file.originalname), evidenceLevel: "documental", validationStatus: "pendiente" }
  });
  return { document: await getKdeDocument(input.organizationId, document.id), version, source };
}

export async function getKdeDocument(organizationId: string, id: string) {
  return prisma.document.findFirstOrThrow({
    where: { id, organizationId },
    include: {
      documentType: true,
      versions: { orderBy: { versionNumber: "desc" } },
      tagLinks: { include: { tag: true } },
      relations: { orderBy: { createdAt: "desc" } },
      chunks: { orderBy: { chunkIndex: "asc" } },
      ocrResults: { orderBy: { createdAt: "desc" } },
      knowledgeSources: true
    }
  });
}

export async function kdeDashboard(organizationId: string) {
  const [total, pending, versioned, indexed, byType, unclassified] = await Promise.all([
    prisma.document.count({ where: { organizationId } }),
    prisma.document.count({ where: { organizationId, status: { in: ["pendiente", "procesando", "requiere_revision"] } } }),
    prisma.document.count({ where: { organizationId, versions: { some: { versionNumber: { gt: 1 } } } } }),
    prisma.document.count({ where: { organizationId, indexingStatus: "preparado" } }),
    prisma.document.groupBy({ by: ["documentTypeId"], where: { organizationId }, _count: true }),
    prisma.document.count({ where: { organizationId, documentTypeId: null } })
  ]);
  return { total, pending, versioned, indexed, unclassified, byType };
}

export async function searchKdeDocuments(organizationId: string, filters: { q?: string; type?: string; status?: string; tag?: string }) {
  const q = filters.q?.trim();
  const where: Prisma.DocumentWhereInput = {
    organizationId,
    ...(filters.status ? { status: filters.status as never } : {}),
    ...(filters.type ? { documentType: { code: filters.type } } : {}),
    ...(filters.tag ? { tagLinks: { some: { tag: { name: { contains: filters.tag } } } } } : {}),
    ...(q ? {
      OR: [
        { title: { contains: q } },
        { originalFilename: { contains: q } },
        { author: { contains: q } },
        { supplier: { contains: q } },
        { manufacturer: { contains: q } },
        { detectedEntity: { contains: q } },
        { summary: { contains: q } },
        { chunks: { some: { content: { contains: q } } } },
        { ocrResults: { some: { text: { contains: q } } } },
        { tagLinks: { some: { tag: { name: { contains: q } } } } }
      ]
    } : {})
  };
  return prisma.document.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { documentType: true, tagLinks: { include: { tag: true } }, versions: { orderBy: { versionNumber: "desc" }, take: 1 }, relations: true }
  });
}

export async function addDocumentVersion(input: { organizationId: string; userId: string; documentId: string; file: Express.Multer.File; extension: string; changeReason: string }) {
  const document = await prisma.document.findFirstOrThrow({ where: { id: input.documentId, organizationId: input.organizationId }, include: { versions: true } });
  const storedFilename = createStoredFilename(input.file.originalname);
  const storagePath = incomingPath(storedFilename);
  await fs.writeFile(storagePath, input.file.buffer);
  const versionNumber = Math.max(...document.versions.map((version) => version.versionNumber), 0) + 1;
  const version = await prisma.documentVersion.create({
    data: {
      organizationId: input.organizationId,
      documentId: input.documentId,
      versionNumber,
      originalFilename: input.file.originalname,
      storedFilename,
      mimeType: input.file.mimetype || mimeByExtension(input.extension),
      fileExtension: input.extension,
      sizeBytes: input.file.size,
      storagePath,
      checksumSha256: await checksum(input.file.buffer),
      changeReason: input.changeReason,
      createdByUserId: input.userId
    }
  });
  await prisma.document.update({ where: { id: document.id }, data: { currentVersionId: version.id, updatedAt: new Date() } });
  return version;
}

async function createChunksAndOcr(input: { organizationId: string; userId: string; documentId: string; text: string; extension: string; filename: string }) {
  const content = input.text || `OCR pendiente/preparado para ${input.filename}. No se inventa contenido tecnico.`;
  await prisma.documentChunk.createMany({
    data: chunkText(content).map((chunk, index) => ({
      organizationId: input.organizationId,
      documentId: input.documentId,
      chunkCode: `${input.documentId.slice(0, 8)}-CHK-${String(index + 1).padStart(3, "0")}`,
      chunkIndex: index + 1,
      content: chunk,
      sourceReference: `chunk ${index + 1}`,
      embeddingStatus: "preparado"
    }))
  });
  if (["pdf", "png", "jpg", "jpeg", "webp", "tiff"].includes(input.extension)) {
    await prisma.ocrResult.create({
      data: {
        organizationId: input.organizationId,
        documentId: input.documentId,
        text: input.text || `OCR preparado para ${input.filename}. Informacion insuficiente para extraer texto sin motor OCR externo.`,
        confidence: input.text ? 0.86 : 0.35,
        detectedLanguage: detectLanguage(input.text),
        sourceReference: input.extension === "pdf" ? "PDF" : "imagen",
        createdByUserId: input.userId
      }
    });
  }
}

async function extractPreviewText(storagePath: string, extension: string, filename: string) {
  if (["txt", "csv"].includes(extension)) return fs.readFile(storagePath, "utf8").catch(() => "");
  if (extension === "pdf") return `Documento PDF cargado: ${filename}. Extraccion OCR real preparada para motor externo.`;
  return "";
}

function chunkText(text: string) {
  const clean = text.trim() || "Contenido pendiente de extraccion.";
  const chunks = clean.match(/[\s\S]{1,900}/g) ?? [clean];
  return chunks.slice(0, 8);
}

function titleFromFilename(filename: string) {
  return path.basename(filename, path.extname(filename)).replace(/[_-]+/g, " ");
}

function summarize(text: string, filename: string) {
  if (!text.trim()) return `Documento cargado como evidencia. Extraccion completa pendiente para ${filename}.`;
  return text.replace(/\s+/g, " ").slice(0, 320);
}

function keywordList(filename: string, text: string) {
  const source = normalize(`${filename} ${text}`);
  return Object.keys(typeHints).filter((keyword) => source.includes(keyword)).slice(0, 12);
}

function detectLanguage(text: string) {
  const normalized = normalize(text);
  if (/\b(the|and|supplier|manufacturer)\b/.test(normalized)) return "en";
  return "es";
}

function detectAfterLabel(text: string, labels: string[]) {
  const lines = text.split(/\r?\n/).slice(0, 40);
  for (const line of lines) {
    const normalized = normalize(line);
    const label = labels.find((item) => normalized.startsWith(`${item}:`) || normalized.startsWith(`${item} `));
    if (label) return line.slice(label.length).replace(/^[:\s-]+/, "").trim().slice(0, 180) || null;
  }
  return null;
}

function mimeByExtension(extension: string) {
  if (extension === "pdf") return "application/pdf";
  if (extension === "txt") return "text/plain";
  if (extension === "csv") return "text/csv";
  if (extension === "png") return "image/png";
  if (["jpg", "jpeg"].includes(extension)) return "image/jpeg";
  if (extension === "webp") return "image/webp";
  return "application/octet-stream";
}
