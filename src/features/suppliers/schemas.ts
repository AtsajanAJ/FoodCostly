import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().trim().min(1).max(150),
  contactName: z.string().trim().max(150).optional().nullable(),
  email: z.string().trim().email().optional().nullable().or(z.literal("")),
  phone: z.string().trim().max(50).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const archiveSupplierSchema = z.object({
  supplierId: z.string().min(1),
});
