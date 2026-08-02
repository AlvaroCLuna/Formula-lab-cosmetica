import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";
import { config } from "../config.js";

export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== "activo") {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  return {
    id: user.id,
    organizationId: user.organizationId,
    email: user.email,
    fullName: user.fullName,
    status: user.status
  };
}

export function signSession(user: { id: string; organizationId: string; email: string; fullName: string; status: string }) {
  return jwt.sign(user, config.jwtSecret, { expiresIn: "8h" });
}

export function verifySession(token: string) {
  return jwt.verify(token, config.jwtSecret) as {
    id: string;
    organizationId: string;
    email: string;
    fullName: string;
    status: "activo" | "inactivo" | "archivado";
  };
}

export async function preparePasswordRecovery(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { prepared: true };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await prisma.passwordResetRequest.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt
    }
  });

  return { prepared: true };
}
