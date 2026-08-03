import { describe, expect, it } from "vitest";
import { canSuggestLot, chooseFefoLots, lotAlerts } from "../../app/backend/src/services/inventory.service.js";

function lot(overrides: Record<string, unknown>) {
  return {
    id: "lot",
    organizationId: "demo-org",
    rawMaterialMasterId: "rm-sci",
    commercialProductId: null,
    supplierId: null,
    manufacturerId: null,
    permanentCode: "LOT-00001",
    supplierLotNumber: null,
    lotCode: "LOT-00001",
    receivedAt: null,
    manufacturedAt: null,
    expirationDate: new Date("2027-01-01T00:00:00.000Z"),
    expectedQuantity: null,
    receivedQuantity: 100,
    availableQuantity: 100,
    reservedQuantity: 0,
    unit: "g",
    unitCost: null,
    currency: "MXN",
    exchangeRate: null,
    locationId: null,
    status: "aprobado",
    packageIntact: null,
    correctIdentification: null,
    appearance: null,
    color: null,
    odor: null,
    receptionDecision: null,
    observations: null,
    createdAt: new Date("2026-08-02T00:00:00.000Z"),
    updatedAt: new Date("2026-08-02T00:00:00.000Z"),
    ...overrides
  } as never;
}

describe("inventory service", () => {
  it("no sugiere lotes bloqueados, rechazados, caducados ni sin existencia", () => {
    expect(canSuggestLot(lot({ status: "aprobado", availableQuantity: 20 }))).toBe(true);
    expect(canSuggestLot(lot({ status: "bloqueado" }))).toBe(false);
    expect(canSuggestLot(lot({ status: "rechazado" }))).toBe(false);
    expect(canSuggestLot(lot({ expirationDate: new Date("2020-01-01T00:00:00.000Z") }))).toBe(false);
    expect(canSuggestLot(lot({ availableQuantity: 0 }))).toBe(false);
  });

  it("elige lotes FEFO y respeta cantidad requerida", () => {
    const selected = chooseFefoLots([
      lot({ id: "late", expirationDate: new Date("2027-06-01T00:00:00.000Z"), availableQuantity: 80 }),
      lot({ id: "soon", expirationDate: new Date("2027-02-01T00:00:00.000Z"), availableQuantity: 40 }),
      lot({ id: "blocked", status: "bloqueado", expirationDate: new Date("2027-01-01T00:00:00.000Z"), availableQuantity: 100 })
    ], 90);

    expect(selected.map((item) => item.lot.id)).toEqual(["soon", "late"]);
    expect(selected.map((item) => item.suggestedQuantity)).toEqual([40, 50]);
  });

  it("genera alertas de caducidad, cuarentena, bloqueo y stock insuficiente", () => {
    const alerts = lotAlerts(lot({ status: "cuarentena", expirationDate: null, availableQuantity: 0 }));
    expect(alerts).toContain("Lote sin fecha de caducidad.");
    expect(alerts).toContain("Lote en cuarentena.");
    expect(alerts).toContain("Stock insuficiente.");
    expect(lotAlerts(lot({ status: "bloqueado" }))).toContain("Lote bloqueado.");
  });
});
