import { describe, expect, it } from "vitest";
import { validateWorkflowGraph } from "../../app/backend/src/services/studio.service.js";

describe("formula lab studio workflow validator", () => {
  it("valida un flujo BPM con inicio, aprobacion y fin", () => {
    const result = validateWorkflowGraph(
      [
        { nodeKey: "inicio", nodeType: "inicio", label: "Inicio" },
        { nodeKey: "aprobacion", nodeType: "aprobacion", label: "Aprobacion" },
        { nodeKey: "fin", nodeType: "fin", label: "Fin" }
      ],
      [
        { fromNodeKey: "inicio", toNodeKey: "aprobacion", label: "enviar" },
        { fromNodeKey: "aprobacion", toNodeKey: "fin", label: "aprobar" }
      ]
    );

    expect(result.valid).toBe(true);
    expect(result.path).toEqual(["Inicio", "Aprobacion", "Fin"]);
  });

  it("rechaza flujos sin nodo de fin", () => {
    const result = validateWorkflowGraph([{ nodeKey: "inicio", nodeType: "inicio", label: "Inicio" }], []);
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toMatch(/fin/i);
  });

  it("advierte ciclos para exigir salida documentada", () => {
    const result = validateWorkflowGraph(
      [
        { nodeKey: "inicio", nodeType: "inicio", label: "Inicio" },
        { nodeKey: "revision", nodeType: "decision", label: "Revision" },
        { nodeKey: "fin", nodeType: "fin", label: "Fin" }
      ],
      [
        { fromNodeKey: "inicio", toNodeKey: "revision", label: "ir" },
        { fromNodeKey: "revision", toNodeKey: "revision", label: "corregir" },
        { fromNodeKey: "revision", toNodeKey: "fin", label: "cerrar" }
      ]
    );

    expect(result.valid).toBe(true);
    expect(result.warnings.join(" ")).toMatch(/ciclo/i);
  });
});
