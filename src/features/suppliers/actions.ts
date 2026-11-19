"use server";

import { revalidatePath } from "next/cache";
import {
  archiveSupplierSchema,
  createSupplierSchema,
} from "@/features/suppliers/schemas";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as supplierService from "@/server/services/supplier-service";

export type ActionResult = { ok: true } | { ok: false; error: string };

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export async function createSupplierAction(
  input: unknown,
): Promise<ActionResult> {
  try {
    const data = createSupplierSchema.parse(input);
    const tenant = await requireTenantContext();
    await supplierService.createSupplierForTenant(tenant, {
      ...data,
      email: data.email || null,
    });
    revalidatePath("/dashboard/suppliers");
    revalidatePath("/dashboard/purchases");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function archiveSupplierAction(
  input: unknown,
): Promise<ActionResult> {
  try {
    const data = archiveSupplierSchema.parse(input);
    const tenant = await requireTenantContext();
    await supplierService.archiveSupplierForTenant(tenant, data.supplierId);
    revalidatePath("/dashboard/suppliers");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
