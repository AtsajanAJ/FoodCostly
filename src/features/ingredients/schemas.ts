import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const createIngredientSchema = z.object({
  name: z.string().trim().min(1).max(150),
  baseUnitId: z.string().min(1),
  categoryId: z.string().optional().nullable(),
  minimumStock: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateIngredientSchema = z.object({
  ingredientId: z.string().min(1),
  name: z.string().trim().min(1).max(150),
  categoryId: z.string().optional().nullable(),
  minimumStock: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const archiveIngredientSchema = z.object({
  ingredientId: z.string().min(1),
});

export const archiveCategorySchema = z.object({
  categoryId: z.string().min(1),
});
