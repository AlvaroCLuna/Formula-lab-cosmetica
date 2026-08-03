import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { recordAudit } from "../services/audit.service.js";
import { calculateCostScenario, normalizeProductCost, type CostIngredient } from "../services/cost-engine.service.js";
import { getVersionForOrganization } from "../services/formulation-versioning.service.js";
import { costScenarioSchema, priceHistorySchema } from "../validators/cost-engine.schemas.js";

export const costEngineRouter = Router();

costEngineRouter.use(requireAuth);

async function loadCostIngredients(versionId: string, organizationId: string) {
  return prisma.formulationIngredient.findMany({
    where: { formulationVersionId: versionId, organizationId, status: "activo" },
    orderBy: { orderIndex: "asc" },
    include: { rawMaterialMaster: { include: { products: { where: { status: "activo" }, include: { priceHistory: { orderBy: { quotedAt: "desc" }, take: 5 } } } } } }
  }) as unknown as Promise<CostIngredient[]>;
}

costEngineRouter.post("/versions/:id/simulate", async (req, res, next) => {
  try {
    const input = costScenarioSchema.parse(req.body);
    await getVersionForOrganization(req.params.id, req.user!.organizationId);
    const ingredients = await loadCostIngredients(req.params.id, req.user!.organizationId);
    const result = calculateCostScenario({ ingredients, ...input });
    return res.json({ result });
  } catch (error) {
    return next(error);
  }
});

costEngineRouter.post("/versions/:id/scenarios", async (req, res, next) => {
  try {
    const input = costScenarioSchema.parse(req.body);
    const version = await getVersionForOrganization(req.params.id, req.user!.organizationId);
    const ingredients = await loadCostIngredients(req.params.id, req.user!.organizationId);
    const result = calculateCostScenario({ ingredients, ...input });
    const scenario = await prisma.costScenario.create({
      data: {
        organizationId: req.user!.organizationId,
        formulationVersionId: version.id,
        name: input.name,
        batchSize: input.batchSize,
        currency: input.currency,
        exchangeRate: input.exchangeRate,
        exchangeRateDate: new Date(),
        providerStrategy: input.providerStrategy,
        additionalCostsJson: input.additionalCosts,
        marginPercent: input.marginPercent,
        markupPercent: input.markupPercent,
        subtotalIngredients: result.subtotalIngredients,
        subtotalAdditional: result.subtotalAdditional,
        totalCost: result.totalCost,
        costPerKg: result.costPerKg,
        wholesalePrice: result.wholesalePrice,
        retailPrice: result.retailPrice,
        suggestedPrice: result.suggestedPrice,
        alertsJson: result.alerts,
        createdByUserId: req.user!.id,
        items: {
          create: result.items.map((item) => ({
            organizationId: req.user!.organizationId,
            formulationIngredientId: item.ingredient.id,
            commercialProductId: item.product?.id,
            displayName: item.ingredient.displayName,
            phase: item.ingredient.phase,
            percentage: item.ingredient.percentage,
            grams: item.grams,
            currency: item.product?.currency ?? input.currency,
            unitCost: item.unitCost,
            lineCost: item.lineCost,
            costSharePercent: item.costSharePercent,
            priceDate: item.product?.quotedAt,
            traceJson: item.trace
          }))
        }
      },
      include: { items: true }
    });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "cost_scenario", entityId: scenario.id, action: "escenario_costo_generado", after: scenario });
    return res.status(201).json({ scenario, result });
  } catch (error) {
    return next(error);
  }
});

costEngineRouter.get("/versions/:id/scenarios", async (req, res, next) => {
  try {
    const scenarios = await prisma.costScenario.findMany({
      where: { formulationVersionId: req.params.id, organizationId: req.user!.organizationId },
      orderBy: { createdAt: "desc" },
      include: { items: true }
    });
    return res.json({ scenarios });
  } catch (error) {
    return next(error);
  }
});

costEngineRouter.get("/products/:id/normalized", async (req, res, next) => {
  try {
    const product = await prisma.rawMaterialCommercialProduct.findFirstOrThrow({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    return res.json({ normalized: normalizeProductCost(product) });
  } catch (error) {
    return next(error);
  }
});

costEngineRouter.post("/products/:id/prices", async (req, res, next) => {
  try {
    const input = priceHistorySchema.parse(req.body);
    const product = await prisma.rawMaterialCommercialProduct.findFirstOrThrow({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    const history = await prisma.rawMaterialPriceHistory.create({
      data: {
        organizationId: req.user!.organizationId,
        commercialProductId: product.id,
        supplierId: product.supplierId,
        previousPrice: product.price,
        newPrice: input.newPrice,
        currency: input.currency,
        taxRate: input.taxRate,
        shippingCost: input.shippingCost,
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
        reason: input.reason,
        evidenceReference: input.evidenceReference,
        createdByUserId: req.user!.id
      }
    });
    const updated = await prisma.rawMaterialCommercialProduct.update({
      where: { id: product.id },
      data: { price: input.newPrice, averageCost: input.newPrice, currency: input.currency, taxRate: input.taxRate, shippingCost: input.shippingCost, priceValidUntil: input.validUntil ? new Date(input.validUntil) : null, quotedAt: new Date() }
    });
    await recordAudit({ organizationId: req.user!.organizationId, userId: req.user!.id, entityType: "raw_material_price_history", entityId: history.id, action: "precio_producto_actualizado", before: product, after: { history, updated } });
    return res.status(201).json({ history, product: updated });
  } catch (error) {
    return next(error);
  }
});
