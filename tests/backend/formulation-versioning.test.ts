import { describe, expect, it } from "vitest";
import { buildVersionSnapshot, isEditableVersion, validateFormulationTotal } from "../../app/backend/src/services/formulation-versioning.service.js";

describe("formulation versioning", () => {
  it("validates exact 100 percent totals", () => {
    expect(validateFormulationTotal([{ percentage: 30 }, { percentage: 70 }])).toEqual({ total: 100, isValid: true });
    expect(validateFormulationTotal([{ percentage: 30 }, { percentage: 69.5 }])).toEqual({ total: 99.5, isValid: false });
  });

  it("marks only draft and review versions as editable", () => {
    expect(isEditableVersion({ status: "borrador" })).toBe(true);
    expect(isEditableVersion({ status: "en_revision" })).toBe(true);
    expect(isEditableVersion({ status: "aprobada" })).toBe(false);
  });

  it("builds a persistent approval snapshot", () => {
    const snapshot = buildVersionSnapshot({
      id: "v1",
      formulationFamilyId: "f1",
      organizationId: "org",
      versionNumber: 1,
      status: "aprobada" as const,
      name: "Crema demo",
      category: "Facial",
      objective: null,
      notes: "Demo",
      approvedByUserId: "user",
      approvedAt: new Date(),
      snapshotJson: null,
      createdByUserId: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      ingredients: [
        {
          id: "i1",
          organizationId: "org",
          formulationVersionId: "v1",
          rawMaterialMasterId: "rm1",
          displayName: "Agua",
          inci: "Aqua",
          cosmeticFunction: "Vehiculo",
          phase: "A",
          percentage: 100,
          baseQuantity: 100,
          unit: "g",
          orderIndex: 1,
          sourceType: "materia_prima_maestra" as const,
          sourceReference: "MP-0001",
          estimatedCost: null,
          productionNotes: null,
          inventoryLockPolicy: null,
          status: "activo" as const,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    });

    expect(snapshot.ingredients).toHaveLength(1);
    expect(snapshot.ingredients[0].displayName).toBe("Agua");
  });
});
