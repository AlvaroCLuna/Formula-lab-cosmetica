import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { ZodError } from "zod";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.routes.js";
import { documentsRouter } from "./routes/documents.routes.js";
import { draftsRouter } from "./routes/drafts.routes.js";
import { formulationsRouter } from "./routes/formulations.routes.js";
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
