import { describe, expect, it } from "vitest";
import { calculateCostScenario, normalizeProductCost } from "../../app/backend/src/services/cost-engine.service.js";

const product = {
  id: "p1",
  organizationId: "org",
  rawMaterialMasterId: "rm1",
  manufacturerId: null,
  supplierId: "s1",
  tradeName: "Agua",
  sku: null,
  permanentCode: "PC-1",
  presentation: "Garrafa",
  presentationQuantity: 1000,
  unit: "g",
  price: 100,
  taxRate: 16,
  shippingCost: 4,
  minimumPurchase: 1,
  priceValidUntil: new Date("2026-12-31"),
  quotedAt: new Date("2026-08-01"),
  observations: null,
  averageCost: 100,
  currency: "MXN",
  status: "activo" as const,
  createdAt: new Date(),
  updatedAt: new Date()
};

describe("cost engine", () => {
  it("normalizes acquisition cost per gram and kilogram", () => {
    const normalized = normalizeProductCost(product);
    expect(normalized?.totalAcquisitionCost).toBe(120);
    expect(normalized?.costPerGram).toBe(0.12);
    expect(normalized?.costPerKg).toBe(120);
  });

  it("calculates ingredient, additional and sale scenario costs", () => {
    const result = calculateCostScenario({
      batchSize: 1000,
      currency: "MXN",
      exchangeRate: 1,
      providerStrategy: "precio_reciente",
      additionalCosts: { empaque: 10 },
      marginPercent: 50,
      markupPercent: 100,
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
          sourceType: "materia_prima_maestra",
          sourceReference: "MP",
          estimatedCost: null,
          productionNotes: null,
          inventoryLockPolicy: null,
          status: "activo",
          createdAt: new Date(),
          updatedAt: new Date(),
          rawMaterialMaster: { products: [product] }
        } as any
      ]
    });
    expect(result.subtotalIngredients).toBe(120);
    expect(result.totalCost).toBe(130);
    expect(result.wholesalePrice).toBe(260);
    expect(result.retailPrice).toBe(260);
  });
});
