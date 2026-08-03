import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { guidedSelection, resolveNeed, universalKnowledgeSearch } from "../services/knowledge-center.service.js";
import { guidedSelectionSchema, knowledgeSearchSchema } from "../validators/knowledge-center.schemas.js";

export const knowledgeCenterRouter = Router();
knowledgeCenterRouter.use(requireAuth);

knowledgeCenterRouter.get("/categories", async (_req, res, next) => {
  try {
    const categories = await prisma.productCategory.findMany({ where: { status: "activo" }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { products: { where: { status: "activo" }, include: { familyRelations: { include: { family: true } } } } } });
    return res.json({ categories });
  } catch (error) {
    return next(error);
  }
});

knowledgeCenterRouter.get("/products", async (_req, res, next) => {
  try {
    const products = await prisma.productType.findMany({ where: { status: "activo" }, orderBy: { name: "asc" }, include: { category: true, familyRelations: { include: { family: true, subfamily: true } } } });
    return res.json({ products });
  } catch (error) {
    return next(error);
  }
});

knowledgeCenterRouter.get("/products/:id", async (req, res, next) => {
  try {
    const product = await prisma.productType.findFirstOrThrow({ where: { id: req.params.id, status: "activo" }, include: { category: true, familyRelations: { include: { family: true, subfamily: true } }, searchTerms: true } });
    return res.json({ product });
  } catch (error) {
    return next(error);
  }
});

knowledgeCenterRouter.get("/families", async (_req, res, next) => {
  try {
    const families = await prisma.knowledgeFormulationFamily.findMany({ where: { status: "activo" }, orderBy: { name: "asc" }, include: { subfamilies: true, productRelations: { include: { productType: true } }, glossaryTerms: true } });
    return res.json({ families });
  } catch (error) {
    return next(error);
  }
});

knowledgeCenterRouter.get("/families/:id", async (req, res, next) => {
  try {
    const family = await prisma.knowledgeFormulationFamily.findFirstOrThrow({ where: { id: req.params.id, status: "activo" }, include: { subfamilies: true, productRelations: { include: { productType: true } }, glossaryTerms: true } });
    return res.json({ family });
  } catch (error) {
    return next(error);
  }
});

knowledgeCenterRouter.get("/needs", async (_req, res, next) => {
  try {
    const needs = await prisma.cosmeticNeed.findMany({ where: { status: "activo" }, orderBy: [{ area: "asc" }, { name: "asc" }] });
    return res.json({ needs });
  } catch (error) {
    return next(error);
  }
});

knowledgeCenterRouter.get("/needs/:id", async (req, res, next) => {
  try {
    return res.json(await resolveNeed(req.params.id));
  } catch (error) {
    return next(error);
  }
});

knowledgeCenterRouter.get("/glossary", async (_req, res, next) => {
  try {
    const terms = await prisma.familyGlossaryTerm.findMany({ where: { status: "activo" }, orderBy: { term: "asc" }, include: { family: true } });
    return res.json({ terms });
  } catch (error) {
    return next(error);
  }
});

knowledgeCenterRouter.get("/search", async (req, res, next) => {
  try {
    const query = knowledgeSearchSchema.parse(req.query);
    return res.json(await universalKnowledgeSearch(query.q));
  } catch (error) {
    return next(error);
  }
});

knowledgeCenterRouter.post("/guided-selection", async (req, res, next) => {
  try {
    const input = guidedSelectionSchema.parse(req.body);
    return res.json(await guidedSelection(input));
  } catch (error) {
    return next(error);
  }
});
