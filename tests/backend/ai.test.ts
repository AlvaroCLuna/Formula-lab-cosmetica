import { describe, expect, it } from "vitest";
import { evaluateStructuredCondition } from "../../app/backend/src/services/ai.service";

describe("ai responsible rules", () => {
  it("evalua condiciones estructuradas sin inferir fuera de regla", () => {
    expect(evaluateStructuredCondition({ field: "availableQuantity", operator: "lt", value: 10 }, { availableQuantity: 4 }).triggered).toBe(true);
    expect(evaluateStructuredCondition({ field: "status", operator: "in", value: ["cuarentena"] }, { status: "aprobado" }).triggered).toBe(false);
  });

  it("marca informacion faltante mediante regla estructurada", () => {
    const result = evaluateStructuredCondition({ field: "evidenceDocumentId", operator: "missing" }, { evidenceDocumentId: null });
    expect(result.triggered).toBe(true);
    expect(result.reason).toMatch(/no tiene dato/i);
  });
});
