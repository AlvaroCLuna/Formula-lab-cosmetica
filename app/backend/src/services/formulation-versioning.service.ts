import type { FormulationIngredient, FormulationVersion } from "@prisma/client";
import { prisma } from "../db.js";

export type VersionWithIngredients = FormulationVersion & { ingredients: FormulationIngredient[] };

export function isEditableVersion(version: { status: string }) {
  return ["borrador", "en_revision"].includes(version.status);
}

export function assertEditableVersion(version: { status: string }) {
  if (!isEditableVersion(version)) {
    throw new Error("Una version aprobada, rechazada u obsoleta no puede modificarse. Crea una nueva version.");
  }
}

export function validateFormulationTotal(ingredients: Array<{ percentage: number }>) {
  const total = ingredients.reduce((sum, ingredient) => sum + Number(ingredient.percentage), 0);
  const rounded = Math.round(total * 1000) / 1000;
  return {
    total: rounded,
    isValid: rounded === 100
  };
}

export function buildVersionSnapshot(version: VersionWithIngredients) {
  return {
    versionId: version.id,
    formulationFamilyId: version.formulationFamilyId,
    versionNumber: version.versionNumber,
    name: version.name,
    category: version.category,
    objective: version.objective,
    notes: version.notes,
    ingredients: version.ingredients.map((ingredient) => ({
      rawMaterialMasterId: ingredient.rawMaterialMasterId,
      displayName: ingredient.displayName,
      inci: ingredient.inci,
      cosmeticFunction: ingredient.cosmeticFunction,
      phase: ingredient.phase,
      percentage: ingredient.percentage,
      baseQuantity: ingredient.baseQuantity,
      unit: ingredient.unit,
      orderIndex: ingredient.orderIndex,
      sourceType: ingredient.sourceType,
      sourceReference: ingredient.sourceReference
    }))
  };
}

export async function getVersionForOrganization(id: string, organizationId: string) {
  return prisma.formulationVersion.findFirstOrThrow({
    where: { id, organizationId },
    include: { ingredients: { where: { status: "activo" }, orderBy: { orderIndex: "asc" } }, family: true }
  });
}
