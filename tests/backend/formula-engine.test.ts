import { describe, expect, it } from "vitest";
import { calculateFormulaEngine, compareFormulaEngineVersions, validateFormulaEngine } from "../../app/backend/src/services/formula-engine.service.js";

const ingredients = [
  { id: "i1", rawMaterialMasterId: "rm1", displayName: "Agua", phase: "A", percentage: 70, baseQuantity: 70, orderIndex: 1 },
  { id: "i2", rawMaterialMasterId: "rm2", displayName: "Glicerina", phase: "B", percentage: 30, baseQuantity: 30, orderIndex: 2 }
];

describe("formula engine", () => {
  it("calculates scaled grams without changing percentages", () => {
    const result = calculateFormulaEngine(ingredients, 500);
    expect(result.totalPercentage).toBe(100);
    expect(result.totalGrams).toBe(500);
    expect(result.rows[0].grams).toBe(350);
  });

  it("detects validation issues", () => {
    const result = validateFormulaEngine([{ ...ingredients[0], percentage: -1 }], [{ name: "A" }, { name: "B" }]);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "NEGATIVE_PERCENTAGE")).toBe(true);
    expect(result.issues.some((issue) => issue.code === "EMPTY_PHASE")).toBe(true);
  });

  it("compares phase, order and percentage changes", () => {
    const comparison = compareFormulaEngineVersions(ingredients, [{ ...ingredients[0], phase: "B", percentage: 65, orderIndex: 3 }, ingredients[1]]);
    expect(comparison.changed).toHaveLength(1);
    expect(comparison.changed[0].changes.phase?.after).toBe("B");
  });
});
