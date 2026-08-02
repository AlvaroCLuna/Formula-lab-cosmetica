import { describe, expect, it } from "vitest";
import { loginSchema } from "../../app/backend/src/validators/auth.schemas";

describe("loginSchema", () => {
  it("valida correo y contraseña", () => {
    const parsed = loginSchema.parse({ email: "demo@formulalab.local", password: "FormulaLab2026!" });
    expect(parsed.email).toBe("demo@formulalab.local");
  });

  it("rechaza correos inválidos", () => {
    expect(() => loginSchema.parse({ email: "demo", password: "FormulaLab2026!" })).toThrow();
  });
});
