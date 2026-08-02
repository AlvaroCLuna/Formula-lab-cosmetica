import { z } from "zod";

export const updateExtractedValueSchema = z.object({
  value: z.string().trim().min(1),
  validationStatus: z.enum(["pendiente", "validado", "corregido", "en_conflicto", "rechazado"]).default("corregido")
});

export const draftActionSchema = z.object({
  action: z.enum(["guardar_borrador", "aprobar", "rechazar"])
});
