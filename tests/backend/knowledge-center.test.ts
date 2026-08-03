import { describe, expect, it } from "vitest";
import { pickByIds, scoreText } from "../../app/backend/src/services/knowledge-center.service.js";

describe("knowledge center service", () => {
  it("normaliza busquedas con acentos y terminos comunes", () => {
    expect(scoreText("emulsion", ["Emulsión aceite en agua", "Sistema anhidro"])).toBe(1);
    expect(scoreText("cabello seco", ["Ruta para cabello seco", "Piel grasa"])).toBe(1);
  });

  it("selecciona entidades solo desde ids registrados", () => {
    const items = [{ id: "pt-shampoo-solido" }, { id: "pt-crema-facial" }, { id: "pt-perfume" }];
    expect(pickByIds(items, ["pt-crema-facial", "otro"])).toEqual([{ id: "pt-crema-facial" }]);
    expect(pickByIds(items, null)).toEqual([]);
  });
});
