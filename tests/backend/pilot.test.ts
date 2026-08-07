import { describe, expect, it } from "vitest";
import { buildPilotWorksheetRows, classifyPilotImportRow, pilotMode } from "../../app/backend/src/services/pilot.service";

describe("incremento piloto datos reales", () => {
  it("mantiene visible el modo piloto no productivo", () => {
    expect(pilotMode()).toMatchObject({ mode: "PILOTO", nonProductive: true });
    expect(pilotMode().protections.join(" ")).toContain("No genera facturacion");
  });

  it("clasifica nuevos, duplicados, conflictos y filas vacias", () => {
    expect(classifyPilotImportRow({ nombre: "SCI shampoo solido" }, "recetas:L1").action).toBe("nuevo");
    expect(classifyPilotImportRow({ nombre: "posible duplicado SCI" }, "recetas:L2").status).toBe("requiere_revision");
    expect(classifyPilotImportRow({ nombre: "conflicto de porcentaje" }, "recetas:L3").action).toBe("conflicto");
    expect(classifyPilotImportRow({}, "recetas:L4").status).toBe("rechazado");
  });

  it("calcula gramos de una prueba sin alterar porcentajes", () => {
    const rows = buildPilotWorksheetRows({
      ingredients: [
        { id: "i1", phase: "A", orderIndex: 2, displayName: "Agua", inci: "Aqua", cosmeticFunction: "Vehiculo", percentage: 70 },
        { id: "i2", phase: "A", orderIndex: 1, displayName: "Glicerina", inci: "Glycerin", cosmeticFunction: "Humectante", percentage: 5 }
      ]
    }, 250);
    expect(rows[0]).toMatchObject({ ingredient: "Glicerina", grams: 12.5, percentage: 5 });
    expect(rows[1]).toMatchObject({ ingredient: "Agua", grams: 175, percentage: 70 });
  });
});
