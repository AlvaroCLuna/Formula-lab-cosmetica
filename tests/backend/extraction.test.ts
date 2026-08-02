import { describe, expect, it } from "vitest";
import { mapFieldsFromLines } from "../../app/backend/src/services/field-mapper.service";

describe("mapFieldsFromLines", () => {
  it("extrae campos con evidencia documental", () => {
    const values = mapFieldsFromLines([
      { text: "Nombre comercial: Aloe Vera Gel 10X", reference: "línea 1" },
      { text: "INCI: Aloe Barbadensis Leaf Juice", reference: "línea 2" },
      { text: "pH: 4.5 - 5.5", reference: "línea 3" }
    ]);

    expect(values).toHaveLength(3);
    expect(values[0]).toMatchObject({
      fieldKey: "nombre_comercial",
      sourceReference: "línea 1",
      evidenceType: "documental"
    });
  });

  it("no inventa campos sin evidencia", () => {
    const values = mapFieldsFromLines([{ text: "Documento sin campos reconocibles", reference: "línea 1" }]);
    expect(values).toEqual([]);
  });
});
