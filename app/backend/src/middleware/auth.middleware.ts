import type { NextFunction, Request, Response } from "express";
import { verifySession } from "../services/auth.service.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Sesión requerida." });
  }

  try {
    req.user = verifySession(token);
    return next();
  } catch {
    return res.status(401).json({ message: "Sesión inválida o expirada." });
  }
}
