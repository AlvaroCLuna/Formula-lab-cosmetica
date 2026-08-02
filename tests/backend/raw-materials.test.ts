import { describe, expect, it } from "vitest";
import { buildRawMaterialSnapshot, isEditableRawMaterialVersion } from "../../app/backend/src/services/raw-materials.service.js";

describe("raw material knowledge base", () => {
  it("keeps validated raw material versions immutable", () => {
    expect(isEditableRawMaterialVersion({ status: "borrador" })).toBe(true);
    expect(isEditableRawMaterialVersion({ status: "en_revision" })).toBe(true);
    expect(isEditableRawMaterialVersion({ status: "validada" })).toBe(false);
  });

  it("builds a technical snapshot for approved sheets", () => {
    const snapshot = buildRawMaterialSnapshot({
      id: "rmv1",
      organizationId: "org",
      rawMaterialMasterId: "rm1",
      versionNumber: 1,
      status: "validada" as const,
      commercialName: "SCI",
      commonName: "SCI",
      inci: "Sodium Cocoyl Isethionate",
      cas: null,
      ec: null,
      category: "Tensioactivos",
      family: "Anionicos",
      cosmeticFunction: "Tensioactivo",
      description: "Demo",
      appearance: "Polvo",
      color: null,
      odor: null,
      solubility: null,
      density: null,
      ph: null,
      maxTemperature: null,
      recommendedTemperature: null,
      usageRange: null,
      storageConditions: null,
      shelfLife: null,
      contraindications: null,
      compatibilities: null,
      incompatibilities: null,
      allergens: null,
      observations: null,
      examplesOfUse: null,
      evidenceSummary: "Demo",
      confidenceLevel: "demo",
      approvedByUserId: "user",
      approvedAt: new Date(),
      snapshotJson: null,
      createdByUserId: "user",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    expect(snapshot.commonName).toBe("SCI");
    expect(snapshot.properties.appearance).toBe("Polvo");
    expect(snapshot.safety.observations).toBeNull();
  });
});
