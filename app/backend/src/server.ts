import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { ZodError } from "zod";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.routes.js";
import { documentsRouter } from "./routes/documents.routes.js";
import { draftsRouter } from "./routes/drafts.routes.js";
import { formulationsRouter } from "./routes/formulations.routes.js";
import { formulaEngineRouter } from "./routes/formula-engine.routes.js";
import { costEngineRouter } from "./routes/cost-engine.routes.js";
import { inventoryRouter } from "./routes/inventory.routes.js";
import { productionRouter } from "./routes/production.routes.js";
import { knowledgeCenterRouter } from "./routes/knowledge-center.routes.js";
import { kdeRouter } from "./routes/kde.routes.js";
import { limsRouter } from "./routes/lims.routes.js";
import { qualityRouter } from "./routes/quality.routes.js";
import { purchasesRouter } from "./routes/purchases.routes.js";
import { salesRouter } from "./routes/sales.routes.js";
import { aiRouter } from "./routes/ai.routes.js";
import { biRouter } from "./routes/bi.routes.js";
import { graphRouter } from "./routes/graph.routes.js";
import { rawMaterialsRouter } from "./routes/raw-materials.routes.js";
import { ensureStorageFolders } from "./services/storage.service.js";

const app = express();

app.use(cors({ origin: config.frontendOrigin }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "Formula Lab API" });
});

app.use("/auth", authRouter);
app.use("/documents", documentsRouter);
app.use("/drafts", draftsRouter);
app.use("/formulations", formulationsRouter);
app.use("/formula-engine", formulaEngineRouter);
app.use("/cost-engine", costEngineRouter);
app.use("/inventory", inventoryRouter);
app.use("/production", productionRouter);
app.use("/knowledge-center", knowledgeCenterRouter);
app.use("/kde", kdeRouter);
app.use("/lims", limsRouter);
app.use("/quality", qualityRouter);
app.use("/purchases", purchasesRouter);
app.use("/sales", salesRouter);
app.use("/ai", aiRouter);
app.use("/bi", biRouter);
app.use("/graph", graphRouter);
app.use("/raw-materials", rawMaterialsRouter);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: "Datos inválidos.", issues: error.issues });
  }
  if (error instanceof Error) {
    return res.status(500).json({ message: error.message });
  }
  return res.status(500).json({ message: "Error inesperado." });
});

ensureStorageFolders()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`Formula Lab API escuchando en http://localhost:${config.port}`);
    });
  })
  .catch((error) => {
    console.error("No se pudo preparar almacenamiento documental.", error);
    process.exit(1);
  });
