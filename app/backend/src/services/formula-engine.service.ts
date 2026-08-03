import type { FormulationIngredient } from "@prisma/client";

export type EngineIngredient = Pick<FormulationIngredient, "id" | "rawMaterialMasterId" | "displayName" | "phase" | "percentage" | "baseQuantity" | "orderIndex">;

export function calculateFormulaEngine(ingredients: EngineIngredient[], batchSize = 100) {
  const phaseTotals = new Map<string, number>();
  const rows = ingredients.map((ingredient) => {
    const grams = Math.round((ingredient.percentage / 100) * batchSize * 1000) / 1000;
    phaseTotals.set(ingredient.phase, Math.round(((phaseTotals.get(ingredient.phase) ?? 0) + ingredient.percentage) * 1000) / 1000);
    return { ...ingredient, grams };
  });
  const totalPercentage = Math.round(ingredients.reduce((sum, ingredient) => sum + ingredient.percentage, 0) * 1000) / 1000;
  return {
    batchSize,
    rows,
    phaseTotals: Array.from(phaseTotals.entries()).map(([phase, percentage]) => ({
      phase,
      percentage,
      grams: Math.round((percentage / 100) * batchSize * 1000) / 1000
    })),
    totalPercentage,
    totalGrams: Math.round((totalPercentage / 100) * batchSize * 1000) / 1000
  };
}

export function validateFormulaEngine(ingredients: EngineIngredient[], phases: Array<{ name: string }>) {
  const issues: Array<{ code: string; severity: "error" | "warning"; message: string }> = [];
  const total = Math.round(ingredients.reduce((sum, ingredient) => sum + ingredient.percentage, 0) * 1000) / 1000;
  if (total !== 100) issues.push({ code: "TOTAL_NOT_100", severity: "error", message: `El total debe ser 100%. Total actual: ${total}%.` });
  const byRawMaterial = new Map<string, number>();
  ingredients.forEach((ingredient) => {
    if (!ingredient.rawMaterialMasterId) issues.push({ code: "MISSING_RAW_MATERIAL", severity: "warning", message: `${ingredient.displayName} no esta relacionado con una materia prima maestra.` });
    if (ingredient.rawMaterialMasterId) byRawMaterial.set(ingredient.rawMaterialMasterId, (byRawMaterial.get(ingredient.rawMaterialMasterId) ?? 0) + 1);
    if (ingredient.percentage < 0) issues.push({ code: "NEGATIVE_PERCENTAGE", severity: "error", message: `${ingredient.displayName} tiene porcentaje negativo.` });
    if (ingredient.baseQuantity < 0) issues.push({ code: "INVALID_QUANTITY", severity: "error", message: `${ingredient.displayName} tiene cantidad invalida.` });
  });
  byRawMaterial.forEach((count) => {
    if (count > 1) issues.push({ code: "DUPLICATED_INGREDIENT", severity: "warning", message: "Hay una materia prima repetida en la formulacion." });
  });
  phases.forEach((phase) => {
    if (!ingredients.some((ingredient) => ingredient.phase === phase.name)) {
      issues.push({ code: "EMPTY_PHASE", severity: "warning", message: `La fase ${phase.name} esta vacia.` });
    }
  });
  return { isValid: issues.every((issue) => issue.severity !== "error"), total, issues };
}

export function compareFormulaEngineVersions(base: EngineIngredient[], target: EngineIngredient[]) {
  const keyOf = (ingredient: EngineIngredient) => ingredient.rawMaterialMasterId ?? ingredient.displayName.toLowerCase();
  const baseMap = new Map(base.map((ingredient) => [keyOf(ingredient), ingredient]));
  const targetMap = new Map(target.map((ingredient) => [keyOf(ingredient), ingredient]));
  return {
    added: target.filter((ingredient) => !baseMap.has(keyOf(ingredient))),
    removed: base.filter((ingredient) => !targetMap.has(keyOf(ingredient))),
    changed: target
      .filter((ingredient) => baseMap.has(keyOf(ingredient)))
      .map((ingredient) => {
        const before = baseMap.get(keyOf(ingredient))!;
        const changes: Record<string, { before: unknown; after: unknown }> = {};
        if (before.percentage !== ingredient.percentage) changes.percentage = { before: before.percentage, after: ingredient.percentage };
        if (before.orderIndex !== ingredient.orderIndex) changes.orderIndex = { before: before.orderIndex, after: ingredient.orderIndex };
        if (before.phase !== ingredient.phase) changes.phase = { before: before.phase, after: ingredient.phase };
        return { ingredient: ingredient.displayName, changes };
      })
      .filter((item) => Object.keys(item.changes).length > 0)
  };
}
