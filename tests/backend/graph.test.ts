import { describe, expect, it } from "vitest";
import { createRelationSchema, graphQuerySchema } from "../../app/backend/src/validators/graph.schemas";

describe("digital twin graph validators", () => {
  it("exige evidencia para crear relaciones", () => {
    const result = createRelationSchema.safeParse({
      fromEntityId: "a",
      toEntityId: "b",
      relationTypeCode: "usa",
      evidence: ""
    });
    expect(result.success).toBe(false);
  });

  it("limita profundidad de grafo navegable", () => {
    expect(graphQuerySchema.parse({ depth: "2" }).depth).toBe(2);
    expect(graphQuerySchema.safeParse({ depth: "9" }).success).toBe(false);
  });
});
