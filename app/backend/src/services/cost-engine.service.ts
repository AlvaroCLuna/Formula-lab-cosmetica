import type { FormulationIngredient, RawMaterialCommercialProduct } from "@prisma/client";
import { calculateFormulaEngine } from "./formula-engine.service.js";

export type CostProduct = RawMaterialCommercialProduct & { priceHistory?: Array<{ newPrice: number; quotedAt: Date; validUntil: Date | null; currency: string; taxRate: number | null; shippingCost: number | null }> };
export type CostIngredient = FormulationIngredient & { rawMaterialMaster?: { products: CostProduct[] } | null };

export type CostInput = {
  ingredients: CostIngredient[];
  batchSize: number;
  currency: "MXN" | "USD";
  exchangeRate: number;
  additionalCosts: Record<string, number>;
  marginPercent: number;
  markupPercent: number;
  providerStrategy: "precio_reciente" | "precio_bajo";
};

export function normalizeProductCost(product: CostProduct) {
  const price = product.price ?? product.averageCost;
  if (price == null || product.presentationQuantity == null || !product.unit) return null;
  const tax = price * ((product.taxRate ?? 0) / 100);
  const total = price + tax + (product.shippingCost ?? 0);
  const unit = product.unit.toLowerCase();
  const perBase = total / product.presentationQuantity;
  return {
    totalAcquisitionCost: Math.round(total * 10000) / 10000,
    costPerGram: ["g", "gramo", "gramos"].includes(unit) ? perBase : unit === "kg" ? perBase / 1000 : null,
    costPerKg: unit === "kg" ? perBase : ["g", "gramo", "gramos"].includes(unit) ? perBase * 1000 : null,
    costPerMl: ["ml", "mililitro"].includes(unit) ? perBase : unit === "l" ? perBase / 1000 : null,
    costPerLiter: unit === "l" ? perBase : ["ml", "mililitro"].includes(unit) ? perBase * 1000 : null,
    costPerUnit: ["unidad", "pza", "pieza"].includes(unit) ? perBase : null
  };
}

function chooseProduct(products: CostProduct[], strategy: CostInput["providerStrategy"]) {
  const priced = products.filter((product) => product.status === "activo" && (product.price ?? product.averageCost) != null);
  if (!priced.length) return null;
  if (strategy === "precio_bajo") return priced.sort((a, b) => (a.price ?? a.averageCost ?? Infinity) - (b.price ?? b.averageCost ?? Infinity))[0];
  return priced.sort((a, b) => (b.quotedAt?.getTime?.() ?? b.updatedAt.getTime()) - (a.quotedAt?.getTime?.() ?? a.updatedAt.getTime()))[0];
}

export function calculateCostScenario(input: CostInput) {
  const formula = calculateFormulaEngine(input.ingredients, input.batchSize);
  const alerts: Array<{ code: string; message: string; severity: "warning" | "error" }> = [];
  const items = input.ingredients.map((ingredient) => {
    const product = chooseProduct(ingredient.rawMaterialMaster?.products ?? [], input.providerStrategy);
    if (!ingredient.rawMaterialMasterId) alerts.push({ code: "INGREDIENTE_SIN_MP", severity: "warning", message: `${ingredient.displayName} no tiene materia prima maestra.` });
    if (!product) alerts.push({ code: "SIN_PRECIO", severity: "error", message: `${ingredient.displayName} no tiene producto comercial con precio.` });
    if (product?.currency && product.currency !== input.currency) alerts.push({ code: "MONEDA_DIFERENTE", severity: "warning", message: `${ingredient.displayName} usa moneda ${product.currency}.` });
    if (product?.priceValidUntil && product.priceValidUntil < new Date()) alerts.push({ code: "PRECIO_VENCIDO", severity: "warning", message: `${ingredient.displayName} tiene precio vencido.` });
    const normalized = product ? normalizeProductCost(product) : null;
    const grams = Math.round((ingredient.percentage / 100) * input.batchSize * 1000) / 1000;
    const unitCost = normalized?.costPerGram ?? null;
    const lineCost = unitCost == null ? null : Math.round(unitCost * grams * 10000) / 10000;
    return {
      ingredient,
      product,
      grams,
      unitCost,
      lineCost,
      trace: {
        rawMaterialMasterId: ingredient.rawMaterialMasterId,
        commercialProductId: product?.id ?? null,
        priceDate: product?.quotedAt ?? null,
        currency: product?.currency ?? input.currency,
        exchangeRate: input.exchangeRate
      }
    };
  });
  const subtotalIngredients = Math.round(items.reduce((sum, item) => sum + (item.lineCost ?? 0), 0) * 10000) / 10000;
  const subtotalAdditional = Math.round(Object.values(input.additionalCosts).reduce((sum, value) => sum + Number(value || 0), 0) * 10000) / 10000;
  const totalCost = Math.round((subtotalIngredients + subtotalAdditional) * 10000) / 10000;
  const costPerKg = input.batchSize ? Math.round((totalCost / (input.batchSize / 1000)) * 10000) / 10000 : null;
  const marginPrice = input.marginPercent >= 100 ? null : Math.round((totalCost / (1 - input.marginPercent / 100)) * 10000) / 10000;
  const markupPrice = Math.round(totalCost * (1 + input.markupPercent / 100) * 10000) / 10000;
  return {
    formula,
    items: items.map((item) => ({ ...item, costSharePercent: totalCost ? Math.round(((item.lineCost ?? 0) / totalCost) * 10000) / 100 : null })),
    subtotalIngredients,
    subtotalAdditional,
    totalCost,
    costPerKg,
    wholesalePrice: marginPrice,
    retailPrice: markupPrice,
    suggestedPrice: Math.max(marginPrice ?? 0, markupPrice),
    alerts
  };
}
