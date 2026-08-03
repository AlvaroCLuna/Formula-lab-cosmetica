import { describe, expect, it } from "vitest";
import { detectDocumentType, normalize } from "../../app/backend/src/services/kde.service";

describe("knowledge document engine", () => {
  it("detecta tipos documentales desde el nombre del archivo", () => {
    expect(detectDocumentType("SCI_TDS_proveedor.pdf")).toBe("TDS");
    expect(detectDocumentType("cotizacion_materias_primas.xlsx")).toBe("COTIZACION");
    expect(detectDocumentType("reporte_estabilidad_lote.txt")).toBe("ESTABILIDAD");
  });

  it("normaliza busquedas sin depender de acentos", () => {
    expect(normalize("Cromatografía Cosmética")).toBe("cromatografia cosmetica");
  });
});
