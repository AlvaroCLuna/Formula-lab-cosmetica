import type { CosmeticNeed, GuidedSelectionRule, KnowledgeFormulationFamily, ProductType } from "@prisma/client";
import { prisma } from "../db.js";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function includesTerm(text: string | null | undefined, query: string) {
  return Boolean(text && normalize(text).includes(query));
}

export function scoreText(query: string, values: Array<string | null | undefined>) {
  return values.reduce((score, value) => score + (includesTerm(value, query) ? 1 : 0), 0);
}

export function pickByIds<T extends { id: string }>(items: T[], ids: unknown) {
  const list = Array.isArray(ids) ? ids : [];
  return items.filter((item) => list.includes(item.id));
}

export async function universalKnowledgeSearch(q: string) {
  const query = normalize(q);
  const [products, families, needs, terms] = await Promise.all([
    prisma.productType.findMany({ where: { status: "activo" }, include: { category: true, familyRelations: { include: { family: true, subfamily: true } } } }),
    prisma.knowledgeFormulationFamily.findMany({ where: { status: "activo" }, include: { productRelations: { include: { productType: true } }, glossaryTerms: true } }),
    prisma.cosmeticNeed.findMany({ where: { status: "activo" } }),
    prisma.productSearchTerm.findMany({ where: { status: "activo" } })
  ]);

  const byTerm = terms.filter((term) => includesTerm(term.term, query));
  return {
    products: products
      .map((product) => ({ item: product, score: scoreProduct(product, query) + byTerm.filter((term) => term.productTypeId === product.id).reduce((sum, term) => sum + term.weight, 0) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item),
    families: families
      .map((family) => ({ item: family, score: scoreFamily(family, query) + byTerm.filter((term) => term.familyId === family.id).reduce((sum, term) => sum + term.weight, 0) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item),
    needs: needs
      .map((need) => ({ item: need, score: scoreNeed(need, query) + byTerm.filter((term) => term.needId === need.id).reduce((sum, term) => sum + term.weight, 0) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item)
  };
}

function scoreProduct(product: ProductType & { category?: { name: string } | null; familyRelations?: Array<{ family: { name: string }; subfamily?: { name: string } | null }> }, query: string) {
  return scoreText(query, [product.name, product.description, product.physicalForm, product.usageZone, product.cosmeticNeed, product.category?.name, product.learningSummary, product.familyRelations?.map((relation) => relation.family.name).join(" ")]);
}

function scoreFamily(family: KnowledgeFormulationFamily & { glossaryTerms?: Array<{ term: string; simpleDefinition: string }>; productRelations?: Array<{ productType: { name: string } }> }, query: string) {
  return scoreText(query, [family.name, family.simpleDefinition, family.technicalDefinition, family.typicalStructure, family.glossaryTerms?.map((term) => `${term.term} ${term.simpleDefinition}`).join(" "), family.productRelations?.map((relation) => relation.productType.name).join(" ")]);
}

function scoreNeed(need: CosmeticNeed, query: string) {
  return scoreText(query, [need.area, need.name, need.description, need.difficulty]);
}

export async function resolveNeed(needId: string) {
  const need = await prisma.cosmeticNeed.findFirstOrThrow({ where: { id: needId, status: "activo" } });
  const [products, families, rawMaterials, formulations] = await Promise.all([
    prisma.productType.findMany({ where: { id: { in: Array.isArray(need.productTypeIdsJson) ? need.productTypeIdsJson as string[] : [] } }, include: { category: true, familyRelations: { include: { family: true } } } }),
    prisma.knowledgeFormulationFamily.findMany({ where: { id: { in: Array.isArray(need.familyIdsJson) ? need.familyIdsJson as string[] : [] } } }),
    prisma.rawMaterialMaster.findMany({ where: { id: { in: Array.isArray(need.rawMaterialIdsJson) ? need.rawMaterialIdsJson as string[] : [] } } }),
    prisma.formulationFamily.findMany({ where: { status: { in: ["activa", "en_desarrollo"] } }, include: { versions: { take: 1, orderBy: { versionNumber: "desc" } } } })
  ]);
  return { need, products, families, rawMaterials, formulations, equipment: need.equipmentJson, controls: need.controlsJson };
}

export async function guidedSelection(input: { desiredOutcome?: string; usageZone?: string; physicalForm?: string; difficulty?: string; cosmeticNeed?: string }) {
  const rules = await prisma.guidedSelectionRule.findMany({ where: { status: "activo" } });
  const scored = rules
    .map((rule) => ({ rule, score: scoreRule(rule, input) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  const best = scored.slice(0, 5).map((entry) => entry.rule);
  const productIds = Array.from(new Set(best.flatMap((rule) => Array.isArray(rule.productTypeIdsJson) ? rule.productTypeIdsJson as string[] : [])));
  const familyIds = Array.from(new Set(best.flatMap((rule) => Array.isArray(rule.familyIdsJson) ? rule.familyIdsJson as string[] : [])));
  const rawMaterialIds = Array.from(new Set(best.flatMap((rule) => Array.isArray(rule.rawMaterialIdsJson) ? rule.rawMaterialIdsJson as string[] : [])));
  const [products, families, rawMaterials] = await Promise.all([
    prisma.productType.findMany({ where: { id: { in: productIds } }, include: { category: true, familyRelations: { include: { family: true } } } }),
    prisma.knowledgeFormulationFamily.findMany({ where: { id: { in: familyIds } } }),
    prisma.rawMaterialMaster.findMany({ where: { id: { in: rawMaterialIds } } })
  ]);
  return { rules: best, products, families, rawMaterials };
}

function scoreRule(rule: GuidedSelectionRule, input: { desiredOutcome?: string; usageZone?: string; physicalForm?: string; difficulty?: string; cosmeticNeed?: string }) {
  return [
    [input.desiredOutcome, rule.desiredOutcome],
    [input.usageZone, rule.usageZone],
    [input.physicalForm, rule.physicalForm],
    [input.difficulty, rule.difficulty],
    [input.cosmeticNeed, rule.cosmeticNeed]
  ].reduce((score, [query, value]) => score + (query && includesTerm(value, normalize(query)) ? 1 : 0), 0);
}
