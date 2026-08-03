import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { config } from "../config.js";

const allowedExtensions = new Set([".pdf", ".csv", ".txt"]);
const kdeAllowedExtensions = new Set([".pdf", ".docx", ".xlsx", ".csv", ".txt", ".png", ".jpg", ".jpeg", ".webp", ".tiff", ".mp4", ".mov", ".zip"]);

export function assertAllowedFile(filename: string, mimeType: string) {
  const extension = path.extname(filename).toLowerCase();
  const allowedMime = ["application/pdf", "text/csv", "text/plain", "application/vnd.ms-excel"];
  if (!allowedExtensions.has(extension) || !allowedMime.includes(mimeType)) {
    throw new Error("Solo se admiten archivos PDF, CSV y TXT.");
  }
  return extension.replace(".", "");
}

export function assertAllowedKdeFile(filename: string) {
  const extension = path.extname(filename).toLowerCase();
  if (!kdeAllowedExtensions.has(extension)) {
    throw new Error("Formato no admitido por el Motor Universal de Documentos.");
  }
  return extension.replace(".", "");
}

export async function ensureStorageFolders() {
  await Promise.all(["incoming", "processed", "rejected"].map((folder) => fs.mkdir(path.join(config.storageRoot, folder), { recursive: true })));
}

export function createStoredFilename(originalFilename: string) {
  const extension = path.extname(originalFilename).toLowerCase();
  return `${crypto.randomUUID()}${extension}`;
}

export function incomingPath(storedFilename: string) {
  return path.join(config.storageRoot, "incoming", storedFilename);
}
