import type { FormulationIngredient, FormulationVersion } from "@prisma/client";

type VersionWithIngredients = FormulationVersion & { ingredients: FormulationIngredient[] };

function keyForIngredient(ingredient: FormulationIngredient) {
  return ingredient.rawMaterialMasterId ?? ingredient.displayName.toLowerCase();
}

export function compareFormulationVersions(base: VersionWithIngredients, target: VersionWithIngredients) {
  const baseMap = new Map(base.ingredients.map((ingredient) => [keyForIngredient(ingredient), ingredient]));
  const targetMap = new Map(target.ingredients.map((ingredient) => [keyForIngredient(ingredient), ingredient]));
  const added = target.ingredients.filter((ingredient) => !baseMap.has(keyForIngredient(ingredient)));
  const removed = base.ingredients.filter((ingredient) => !targetMap.has(keyForIngredient(ingredient)));
  const modified = target.ingredients
    .map((ingredient) => {
      const previous = baseMap.get(keyForIngredient(ingredient));
      if (!previous) return null;
      const changes = {
        percentage: previous.percentage !== ingredient.percentage ? { before: previous.percentage, after: ingredient.percentage } : null,
        phase: previous.phase !== ingredient.phase ? { before: previous.phase, after: ingredient.phase } : null,
        function: previous.cosmeticFunction !== ingredient.cosmeticFunction ? { before: previous.cosmeticFunction, after: ingredient.cosmeticFunction } : null,
        order: previous.orderIndex !== ingredient.orderIndex ? { before: previous.orderIndex, after: ingredient.orderIndex } : null
      };
      const activeChanges = Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== null));
      return Object.keys(activeChanges).length > 0 ? { ingredient: ingredient.displayName, changes: activeChanges } : null;
    })
    .filter(Boolean);

  return {
    baseVersion: base.versionNumber,
    targetVersion: target.versionNumber,
    metadata: {
      nameChanged: base.name !== target.name,
      categoryChanged: base.category !== target.category,
      notesChanged: (base.notes ?? "") !== (target.notes ?? "")
    },
    ingredients: {
      added,
      removed,
      modified
    }
  };
}
