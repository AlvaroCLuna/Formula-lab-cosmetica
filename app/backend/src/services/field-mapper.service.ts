import type { ExtractionCandidate } from "../types.js";

const fieldPatterns: Array<{ key: string; label: string; dataType: string; patterns: RegExp[] }> = [
  { key: "nombre_comercial", label: "Nombre comercial", dataType: "texto", patterns: [/nombre comercial[:\s]+(.+)/i, /trade name[:\s]+(.+)/i] },
  { key: "nombre_comun", label: "Nombre común", dataType: "texto", patterns: [/nombre común[:\s]+(.+)/i, /common name[:\s]+(.+)/i] },
  { key: "inci", label: "INCI", dataType: "texto", patterns: [/inci[:\s]+(.+)/i] },
  { key: "cas", label: "CAS", dataType: "identificador", patterns: [/\bcas(?:\s*no\.?)?[:\s]+([0-9-]+)/i] },
  { key: "fabricante", label: "Fabricante", dataType: "texto", patterns: [/fabricante[:\s]+(.+)/i, /manufacturer[:\s]+(.+)/i] },
  { key: "proveedor", label: "Proveedor", dataType: "texto", patterns: [/proveedor[:\s]+(.+)/i, /supplier[:\s]+(.+)/i] },
  { key: "funcion_cosmetica", label: "Función cosmética", dataType: "texto", patterns: [/funci[oó]n cosm[eé]tica[:\s]+(.+)/i, /function[:\s]+(.+)/i] },
  { key: "apariencia", label: "Apariencia", dataType: "texto", patterns: [/apariencia[:\s]+(.+)/i, /appearance[:\s]+(.+)/i] },
  { key: "ph", label: "pH", dataType: "rango", patterns: [/\bpH[:\s]+(.+)/i] },
  { key: "rango_uso", label: "Rango de uso", dataType: "rango", patterns: [/rango de uso[:\s]+(.+)/i, /use level[:\s]+(.+)/i] },
  { key: "temperatura_incorporacion", label: "Temperatura de incorporación", dataType: "temperatura", patterns: [/temperatura de incorporaci[oó]n[:\s]+(.+)/i] },
  { key: "temperatura_maxima", label: "Temperatura máxima", dataType: "temperatura", patterns: [/temperatura m[aá]xima[:\s]+(.+)/i] },
  { key: "almacenamiento", label: "Almacenamiento", dataType: "texto", patterns: [/almacenamiento[:\s]+(.+)/i, /storage[:\s]+(.+)/i] },
  { key: "vida_util", label: "Vida útil", dataType: "duracion", patterns: [/vida [uú]til[:\s]+(.+)/i, /shelf life[:\s]+(.+)/i] },
  { key: "precauciones", label: "Precauciones", dataType: "texto", patterns: [/precauciones[:\s]+(.+)/i, /precautions[:\s]+(.+)/i] },
  { key: "incompatibilidades", label: "Incompatibilidades", dataType: "texto", patterns: [/incompatibilidades[:\s]+(.+)/i, /incompatibilities[:\s]+(.+)/i] }
];

export function mapFieldsFromLines(lines: Array<{ text: string; reference: string }>): ExtractionCandidate[] {
  const results = new Map<string, ExtractionCandidate>();

  for (const line of lines) {
    for (const field of fieldPatterns) {
      if (results.has(field.key)) {
        continue;
      }
      const match = field.patterns.map((pattern) => line.text.match(pattern)).find(Boolean);
      const value = match?.[1]?.trim();
      if (value) {
        results.set(field.key, {
          fieldKey: field.key,
          fieldLabel: field.label,
          value: value.slice(0, 500),
          sourceReference: line.reference,
          dataType: field.dataType,
          evidenceType: "documental",
          confidence: 0.82
        });
      }
    }
  }

  return [...results.values()];
}
