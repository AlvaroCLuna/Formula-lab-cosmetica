import { z } from "zod";

export const listProductionSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional()
});

export const createProductionOrderSchema = z.object({
  formulationVersionId: z.string().min(1),
  targetLotCode: z.string().min(2).optional(),
  plannedQuantity: z.number().positive(),
  plannedUnit: z.string().min(1).default("g"),
  expectedYield: z.number().positive().optional(),
  priority: z.enum(["baja", "media", "alta", "urgente"]).default("media"),
  responsibleUserId: z.string().optional().nullable(),
  operatorUserId: z.string().optional().nullable(),
  plannedStartAt: z.string().datetime().optional().nullable(),
  plannedEndAt: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable()
});

export const transitionProductionSchema = z.object({
  action: z.enum(["planear", "liberar", "iniciar", "pausar", "reanudar", "terminar", "cancelar"]),
  actualYield: z.number().positive().optional(),
  observations: z.string().optional().nullable()
});

export const updateChecklistSchema = z.object({
  completed: z.boolean()
});

export const confirmConsumptionSchema = z.object({
  rawMaterialLotId: z.string().min(1),
  usedQuantity: z.number().positive(),
  wasteQuantity: z.number().min(0).default(0),
  substitutionAuthorized: z.boolean().default(false),
  observations: z.string().optional().nullable()
});

export const createLogSchema = z.object({
  type: z.enum(["inicio", "fin", "pausa", "reanudacion", "incidencia", "observacion", "parametro"]),
  temperature: z.number().optional().nullable(),
  timeMinutes: z.number().optional().nullable(),
  agitationSpeed: z.number().optional().nullable(),
  observations: z.string().optional().nullable(),
  incidence: z.string().optional().nullable()
});

export const createProcessParameterSchema = z.object({
  temperature: z.number().optional().nullable(),
  timeMinutes: z.number().optional().nullable(),
  speed: z.number().optional().nullable(),
  ph: z.number().optional().nullable(),
  viscosity: z.string().optional().nullable(),
  obtainedWeight: z.number().optional().nullable(),
  observations: z.string().optional().nullable()
});
