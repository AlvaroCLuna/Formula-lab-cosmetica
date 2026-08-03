import { describe, expect, it } from "vitest";
import { evaluateConformity } from "../../app/backend/src/services/lims.service";

describe("lims service", () => {
  it("evalua conformidad numerica contra rango documentado", () => {
    expect(evaluateConformity(5.5, "5.0-6.5")).toBe("conforme");
    expect(evaluateConformity(7.1, "5.0-6.5")).toBe("no_conforme");
  });

  it("no concluye cuando falta resultado o especificacion estructurada", () => {
    expect(evaluateConformity(null, "5.0-6.5")).toBe("pendiente");
    expect(evaluateConformity(5.5, "segun criterio visual")).toBe("pendiente");
  });
});
