"use server";

import { revalidatePath } from "next/cache";
import {
  adjustmentSchema,
  stockCountSchema,
  wasteSchema,
} from "@/features/inventory/schemas";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as inventoryService from "@/server/services/inventory-service";

export type ActionResult = { ok: true } | { ok: false; error: string };

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

function revalidateInventory() {
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/inventory/ledger");
  revalidatePath("/dashboard/ingredients");
}

export async function recordWasteAction(input: unknown): Promise<ActionResult> {
  try {
    const data = wasteSchema.parse(input);
    const tenant = await requireTenantContext();
    await inventoryService.recordWaste(tenant, data);
    revalidateInventory();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function recordAdjustmentAction(
  input: unknown,
): Promise<ActionResult> {
  try {
    const data = adjustmentSchema.parse(input);
    const tenant = await requireTenantContext();
    await inventoryService.recordAdjustment(tenant, data);
    revalidateInventory();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function recordStockCountAction(
  input: unknown,
): Promise<ActionResult> {
  try {
    const data = stockCountSchema.parse(input);
    const tenant = await requireTenantContext();
    await inventoryService.recordStockCount(tenant, data);
    revalidateInventory();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
