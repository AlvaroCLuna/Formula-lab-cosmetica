import { Router } from "express";
import { loginSchema, passwordRecoverySchema } from "../validators/auth.schemas.js";
import { preparePasswordRecovery, signSession, verifyCredentials } from "../services/auth.service.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await verifyCredentials(input.email, input.password);
    if (!user) {
      return res.status(401).json({ message: "Correo o contraseña incorrectos." });
    }

    return res.json({ token: signSession(user), user });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/logout", requireAuth, (_req, res) => {
  return res.json({ ok: true });
});

authRouter.get("/me", requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

authRouter.post("/password-recovery/prepare", async (req, res, next) => {
  try {
    const input = passwordRecoverySchema.parse(req.body);
    const result = await preparePasswordRecovery(input.email);
    return res.json({ ...result, message: "Si el correo existe, se preparó una recuperación de contraseña." });
  } catch (error) {
    return next(error);
  }
});
