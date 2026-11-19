import { z } from "zod";

export const wasteSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.string().min(1),
  unitId: z.string().min(1),
  reason: z.string().trim().min(1).max(500),
});

export const adjustmentSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.string().min(1),
  unitId: z.string().min(1),
  direction: z.enum(["IN", "OUT"]),
  reason: z.string().trim().min(1).max(500),
  unitCost: z.string().optional().nullable(),
});

export const stockCountSchema = z.object({
  ingredientId: z.string().min(1),
  countedQuantity: z.string().min(1),
  unitId: z.string().min(1),
  reason: z.string().trim().min(1).max(500),
});
