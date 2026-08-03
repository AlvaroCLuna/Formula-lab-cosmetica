import { describe, expect, it } from "vitest";
import { assertAllowedBiEntity } from "../../app/backend/src/services/bi.service";

describe("bi report builder", () => {
  it("permite entidades analiticas aprobadas", () => {
    expect(assertAllowedBiEntity("inventory")).toBe("inventory");
    expect(assertAllowedBiEntity("sales")).toBe("sales");
  });

  it("rechaza entidades fuera del contrato BI", () => {
    expect(() => assertAllowedBiEntity("raw_sql")).toThrow(/no permitida/i);
  });
});
