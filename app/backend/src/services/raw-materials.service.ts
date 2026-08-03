import type { Prisma, RawMaterialMasterVersion } from "@prisma/client";
import { prisma } from "../db.js";

const rawMaterialDetailInclude = {
  versions: { orderBy: { versionNumber: "desc" } },
  manufacturers: { where: { status: "activo" }, orderBy: { name: "asc" } },
  suppliers: { where: { status: "activo" }, orderBy: { name: "asc" } },
  products: { where: { status: "activo" }, orderBy: { tradeName: "asc" } },
  documents: { where: { status: "activo" }, orderBy: { createdAt: "desc" } },
  lots: { where: { status: { notIn: ["archivado"] } }, orderBy: { createdAt: "desc" } },
  ingredients: {
    where: { status: "activo" },
    include: { version: { include: { family: true } } }
  }
} satisfies Prisma.RawMaterialMasterInclude;

export type RawMaterialDetail = Prisma.RawMaterialMasterGetPayload<{ include: typeof rawMaterialDetailInclude }>;

export function isEditableRawMaterialVersion(version: { status: string }) {
  return ["borrador", "en_revision"].includes(version.status);
}

export function buildRawMaterialSnapshot(version: RawMaterialMasterVersion) {
  return {
    versionId: version.id,
    rawMaterialMasterId: version.rawMaterialMasterId,
    versionNumber: version.versionNumber,
    commercialName: version.commercialName,
    commonName: version.commonName,
    inci: version.inci,
    cas: version.cas,
    ec: version.ec,
    category: version.category,
    family: version.family,
    cosmeticFunction: version.cosmeticFunction,
    description: version.description,
    properties: {
      appearance: version.appearance,
      color: version.color,
      odor: version.odor,
      solubility: version.solubility,
      density: version.density,
      ph: version.ph,
      maxTemperature: version.maxTemperature,
      recommendedTemperature: version.recommendedTemperature,
      usageRange: version.usageRange
    },
    safety: {
      storageConditions: version.storageConditions,
      shelfLife: version.shelfLife,
      contraindications: version.contraindications,
      compatibilities: version.compatibilities,
      incompatibilities: version.incompatibilities,
      allergens: version.allergens,
      observations: version.observations
    },
    evidenceSummary: version.evidenceSummary,
    confidenceLevel: version.confidenceLevel
  };
}

export async function generateRawMaterialCode(organizationId: string) {
  const count = await prisma.rawMaterialMaster.count({ where: { organizationId } });
  return `MP-${String(count + 1).padStart(5, "0")}`;
}

export function buildRawMaterialWhere(input: { organizationId: string; search?: string; category?: string; family?: string; status?: string }) {
  const where: Prisma.RawMaterialMasterWhereInput = { organizationId: input.organizationId };
  if (input.status) where.status = input.status as Prisma.EnumRawMaterialMasterStatusFilter["equals"];
  if (input.category) where.category = input.category;
  if (input.family) where.family = input.family;
  if (input.search) {
    where.OR = [
      { permanentCode: { contains: input.search } },
      { commercialName: { contains: input.search } },
      { commonName: { contains: input.search } },
      { inci: { contains: input.search } },
      { cas: { contains: input.search } }
    ];
  }
  return where;
}

export async function getRawMaterialDetail(id: string, organizationId: string) {
  return prisma.rawMaterialMaster.findFirstOrThrow({
    where: { id, organizationId },
    include: rawMaterialDetailInclude
  });
}

export function buildRawMaterialIntelligence(rawMaterial: RawMaterialDetail) {
  const formulationMap = new Map<string, { id: string; name: string; versionNumber: number; percentage: number }>();
  rawMaterial.ingredients.forEach((ingredient) => {
    formulationMap.set(ingredient.version.formulationFamilyId, {
      id: ingredient.version.formulationFamilyId,
      name: ingredient.version.family.name,
      versionNumber: ingredient.version.versionNumber,
      percentage: ingredient.percentage
    });
  });
  const percentages = rawMaterial.ingredients.map((ingredient) => ingredient.percentage);
  const averageUsage = percentages.length ? Math.round((percentages.reduce((sum, value) => sum + value, 0) / percentages.length) * 100) / 100 : null;
  const costs = rawMaterial.products.map((product) => product.averageCost).filter((value): value is number => typeof value === "number");
  const averageCost = costs.length ? Math.round((costs.reduce((sum, value) => sum + value, 0) / costs.length) * 100) / 100 : null;
  return {
    formulationCount: formulationMap.size,
    averageUsage,
    supplierCount: rawMaterial.suppliers.length,
    documentCount: rawMaterial.documents.length,
    averageCost,
    lastUpdatedAt: rawMaterial.updatedAt,
    formulations: Array.from(formulationMap.values())
  };
}
