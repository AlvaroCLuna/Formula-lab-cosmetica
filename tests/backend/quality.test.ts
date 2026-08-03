import { describe, expect, it } from "vitest";
import { assertNcfCloseable } from "../../app/backend/src/services/quality.service";

describe("quality service", () => {
  it("exige disposicion para cerrar una no conformidad", () => {
    expect(() => assertNcfCloseable("cerrada", null)).toThrow(/disposicion/i);
    expect(assertNcfCloseable("cerrada", "disp-1")).toBe(true);
  });

  it("permite estados abiertos sin disposicion final", () => {
    expect(assertNcfCloseable("abierta", null)).toBe(true);
  });
});
