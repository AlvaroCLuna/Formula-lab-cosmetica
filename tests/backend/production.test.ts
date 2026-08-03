import { describe, expect, it } from "vitest";
import { assertProductionEditable, calculateTheoreticalConsumption } from "../../app/backend/src/services/production.service.js";

describe("production service", () => {
  it("bloquea edicion de ordenes terminadas o canceladas", () => {
    expect(() => assertProductionEditable({ status: "en_proceso" })).not.toThrow();
    expect(() => assertProductionEditable({ status: "terminada" })).toThrow("orden terminada");
    expect(() => assertProductionEditable({ status: "cancelada" })).toThrow("orden cancelada");
  });

  it("calcula consumo teorico desde porcentajes de formulacion", () => {
    const rows = calculateTheoreticalConsumption([
      { id: "ing-1", organizationId: "demo-org", formulationVersionId: "frm", rawMaterialMasterId: "rm-1", displayName: "SCI", inci: null, cosmeticFunction: "Tensioactivo", phase: "A", percentage: 45, baseQuantity: 45, unit: "g", orderIndex: 1, sourceType: "materia_prima_maestra", sourceReference: null, estimatedCost: null, productionNotes: null, inventoryLockPolicy: null, status: "activo", createdAt: new Date(), updatedAt: new Date() },
      { id: "ing-2", organizationId: "demo-org", formulationVersionId: "frm", rawMaterialMasterId: "rm-2", displayName: "Agua", inci: null, cosmeticFunction: "Vehiculo", phase: "A", percentage: 55, baseQuantity: 55, unit: "g", orderIndex: 2, sourceType: "materia_prima_maestra", sourceReference: null, estimatedCost: null, productionNotes: null, inventoryLockPolicy: null, status: "activo", createdAt: new Date(), updatedAt: new Date() }
    ], 1000);

    expect(rows.map((row) => row.requiredQuantity)).toEqual([450, 550]);
    expect(rows.every((row) => row.unit === "g")).toBe(true);
  });
});
