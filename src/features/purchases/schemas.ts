import { z } from "zod";

const purchaseLineSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.string().min(1),
  unitId: z.string().min(1),
  unitPrice: z.string().min(1),
});

export const createPurchaseSchema = z.object({
  supplierId: z.string().min(1),
  purchasedAt: z.string().min(1),
  invoiceNumber: z.string().trim().max(100).optional().nullable(),
  discountAmount: z.string().optional().nullable(),
  taxAmount: z.string().optional().nullable(),
  shippingAmount: z.string().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  lines: z.array(purchaseLineSchema).min(1),
});

export const receivePurchaseSchema = z.object({
  purchaseId: z.string().min(1),
});
