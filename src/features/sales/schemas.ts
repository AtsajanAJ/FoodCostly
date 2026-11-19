import { z } from "zod";

export const createSaleSchema = z.object({
  channelId: z.string().min(1),
  soldAt: z.string().optional().nullable(),
  idempotencyKey: z.string().trim().min(1).max(100),
  discountAmount: z.string().optional().nullable(),
  packagingCost: z.string().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  lines: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.string().min(1),
      }),
    )
    .min(1),
});

export const cancelSaleSchema = z.object({
  saleId: z.string().min(1),
  cancelReason: z.string().trim().min(1).max(500),
});

export const updateChannelFeeSchema = z.object({
  channelId: z.string().min(1),
  feeType: z.enum(["NONE", "PERCENT", "FIXED"]),
  feeValue: z.string().min(1),
});
