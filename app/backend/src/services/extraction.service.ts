import fs from "node:fs/promises";
import pdf from "pdf-parse";
import { parse } from "csv-parse/sync";
import { mapFieldsFromLines } from "./field-mapper.service.js";
import type { ExtractionCandidate } from "../types.js";

type LineEvidence = {
  text: string;
  reference: string;
};

function linesFromText(text: string, referencePrefix: string): LineEvidence[] {
  return text
    .split(/\r?\n/)
    .map((line, index) => ({ text: line.trim(), reference: `${referencePrefix} ${index + 1}` }))
    .filter((line) => line.text.length > 0);
}

export async function extractDocument(filePath: string, extension: string): Promise<ExtractionCandidate[]> {
  if (extension === "txt") {
    const text = await fs.readFile(filePath, "utf8");
    return mapFieldsFromLines(linesFromText(text, "línea"));
  }

  if (extension === "csv") {
    const text = await fs.readFile(filePath, "utf8");
    const records = parse(text, { relax_column_count: true, skip_empty_lines: true }) as string[][];
    const lines = records.flatMap((row, rowIndex) =>
      row.map((cell, cellIndex) => ({
        text: String(cell).trim(),
        reference: `celda F${rowIndex + 1}C${cellIndex + 1}`
      }))
    );
    return mapFieldsFromLines(lines);
  }

  if (extension === "pdf") {
    const buffer = await fs.readFile(filePath);
    const data = await pdf(buffer);
    return mapFieldsFromLines(linesFromText(data.text, "página aproximada"));
  }

  throw new Error("Tipo de archivo no admitido para extracción.");
}
