import { describe, expect, it } from "vitest";
import { compareFormulationVersions } from "../../app/backend/src/services/formulation-comparison.service.js";

function version(versionNumber: number, ingredients: Array<{ id: string; displayName: string; percentage: number }>) {
  return {
    id: `v${versionNumber}`,
    formulationFamilyId: "f1",
    organizationId: "org",
    versionNumber,
    status: "borrador" as const,
    name: "Formula",
    category: "Capilar",
    objective: null,
    notes: null,
    approvedByUserId: null,
    approvedAt: null,
    snapshotJson: null,
    createdByUserId: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    ingredients: ingredients.map((ingredient, index) => ({
      id: ingredient.id,
      organizationId: "org",
      formulationVersionId: `v${versionNumber}`,
      rawMaterialMasterId: ingredient.id,
      displayName: ingredient.displayName,
      inci: null,
      cosmeticFunction: "Funcion",
      phase: "A",
      percentage: ingredient.percentage,
      baseQuantity: ingredient.percentage,
      unit: "g",
      orderIndex: index + 1,
      sourceType: "materia_prima_maestra" as const,
      sourceReference: ingredient.id,
      estimatedCost: null,
      productionNotes: null,
      inventoryLockPolicy: null,
      status: "activo" as const,
      createdAt: new Date(),
      updatedAt: new Date()
    }))
  };
}

describe("formulation comparison", () => {
  it("detects added, removed and modified ingredients", () => {
    const comparison = compareFormulationVersions(
      version(1, [
        { id: "rm1", displayName: "Agua", percentage: 80 },
        { id: "rm2", displayName: "Glicerina", percentage: 20 }
      ]),
      version(2, [
        { id: "rm1", displayName: "Agua", percentage: 75 },
        { id: "rm3", displayName: "Pantenol", percentage: 25 }
      ])
    );

    expect(comparison.ingredients.added).toHaveLength(1);
    expect(comparison.ingredients.removed).toHaveLength(1);
    expect(comparison.ingredients.modified).toHaveLength(1);
  });
});
