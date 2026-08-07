import { z } from "zod";

export const pilotImportKindSchema = z.enum(["formulaciones", "materias_primas", "proveedores", "productos_comerciales", "precios", "documentos_tecnicos", "categorias_productos", "shampoo_solido_legacy"]);

export const createPilotProductSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  description: z.string().optional().nullable(),
  formulationFamilyId: z.string().optional().nullable(),
  currentFormulationVersionId: z.string().optional().nullable()
});

export const createPilotTrialSchema = z.object({
  pilotProductId: z.string().optional().nullable(),
  formulationVersionId: z.string().min(1),
  trialSize: z.coerce.number().positive(),
  unit: z.string().default("g"),
  objective: z.string().min(5)
});

export const recordPilotParameterSchema = z.object({
  parameterType: z.string().min(2),
  label: z.string().min(2),
  valueText: z.string().optional().nullable(),
  valueNumber: z.coerce.number().optional().nullable(),
  unit: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

export const finishPilotTrialSchema = z.object({
  result: z.enum(["satisfactorio", "requiere_ajuste", "fallido", "repetir"]),
  whatWorked: z.string().optional().nullable(),
  whatFailed: z.string().optional().nullable(),
  suggestedChanges: z.string().optional().nullable(),
  observations: z.string().optional().nullable()
});

export const createExperimentalVersionSchema = z.object({
  changeSummary: z.string().min(10)
});
