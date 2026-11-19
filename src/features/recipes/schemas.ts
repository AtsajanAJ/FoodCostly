import { z } from "zod";

const recipeLineSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.string().min(1),
  unitId: z.string().min(1),
  yieldPercent: z.string().optional().nullable(),
});

export const createRecipeSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(1000).optional().nullable(),
  portionCount: z.string().min(1),
  notes: z.string().trim().max(1000).optional().nullable(),
  lines: z.array(recipeLineSchema).min(1),
});

export const publishRecipeVersionSchema = z.object({
  recipeId: z.string().min(1),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const createMenuItemSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(1000).optional().nullable(),
  recipeId: z.string().min(1),
  pinLatestVersion: z.boolean().optional(),
  priceInStore: z.string().optional().nullable(),
  priceDelivery: z.string().optional().nullable(),
});
