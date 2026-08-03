import { describe, expect, it } from "vitest";
import { assertReceiptQuantity, calculatePurchaseTotals } from "../../app/backend/src/services/purchases.service";

describe("purchases service", () => {
  it("calcula subtotal, impuestos y total de una orden de compra", () => {
    const result = calculatePurchaseTotals([
      { itemName: "Glicerina", quantity: 2, unit: "kg", unitPrice: 100, taxRate: 16 },
      { itemName: "Cosgard", quantity: 1, unit: "kg", unitPrice: 500, taxRate: 16 }
    ], 80);

    expect(result.subtotal).toBe(700);
    expect(result.taxTotal).toBe(112);
    expect(result.shippingTotal).toBe(80);
    expect(result.total).toBe(892);
  });

  it("rechaza recepciones superiores al saldo pendiente sin autorizacion", () => {
    expect(() => assertReceiptQuantity(5, 6, null)).toThrow(/autorizacion/i);
    expect(assertReceiptQuantity(5, 6, "Diferencia autorizada por compras")).toBeUndefined();
  });

  it("rechaza ordenes sin renglones", () => {
    expect(() => calculatePurchaseTotals([])).toThrow(/renglon/i);
  });
});
