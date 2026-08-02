import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(backendRoot, "..", "..");

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "desarrollo-formulalab-cambia-este-secreto",
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  storageRoot: path.resolve(projectRoot, process.env.STORAGE_ROOT ?? "storage")
};
