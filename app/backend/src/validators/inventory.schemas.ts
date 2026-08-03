import { z } from "zod";

export const listInventorySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  warehouseId: z.string().optional(),
  rawMaterialMasterId: z.string().optional()
});

export const createLotSchema = z.object({
  rawMaterialMasterId: z.string().min(1),
  commercialProductId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  supplierLotNumber: z.string().optional().nullable(),
  expectedQuantity: z.number().positive().optional().nullable(),
  receivedQuantity: z.number().min(0),
  unit: z.string().min(1),
  expirationDate: z.string().datetime().optional().nullable(),
  unitCost: z.number().min(0).optional().nullable(),
  currency: z.enum(["MXN", "USD"]).default("MXN"),
  observations: z.string().optional().nullable()
});

export const movementSchema = z.object({
  type: z.enum(["entrada", "salida", "ajuste_positivo", "ajuste_negativo", "transferencia", "reserva", "liberacion_reserva", "devolucion", "rechazo", "merma"]),
  quantity: z.number().positive(),
  reason: z.string().min(2),
  reference: z.string().optional().nullable(),
  toLocationId: z.string().optional().nullable()
});

export const availabilitySchema = z.object({
  formulationVersionId: z.string().min(1),
  batchSize: z.coerce.number().positive().default(1000)
});
