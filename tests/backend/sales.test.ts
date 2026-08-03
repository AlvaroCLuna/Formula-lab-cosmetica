import { describe, expect, it } from "vitest";
import { calculateSalesTotals } from "../../app/backend/src/services/sales.service";

describe("sales service", () => {
  it("calcula totales comerciales con descuento, impuesto y envio", () => {
    const result = calculateSalesTotals([{ productId: "p1", quantity: 10, unit: "pieza", unitPrice: 100, discountRate: 10, taxRate: 16 }], 50);
    expect(result.subtotal).toBe(1000);
    expect(result.discountTotal).toBe(100);
    expect(result.taxTotal).toBe(144);
    expect(result.total).toBe(1094);
  });

  it("rechaza cotizaciones o pedidos sin partidas", () => {
    expect(() => calculateSalesTotals([])).toThrow(/partidas/i);
  });
});
