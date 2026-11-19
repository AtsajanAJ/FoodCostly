"use server";

import { revalidatePath } from "next/cache";
import {
  createPurchaseSchema,
  receivePurchaseSchema,
} from "@/features/purchases/schemas";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as purchaseService from "@/server/services/purchase-service";

export type ActionResult =
  | { ok: true; purchaseId?: string }
  | { ok: false; error: string };

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export async function createPurchaseAction(
  input: unknown,
): Promise<ActionResult> {
  try {
    const data = createPurchaseSchema.parse(input);
    const tenant = await requireTenantContext();
    const purchase = await purchaseService.createDraftPurchase(tenant, data);
    revalidatePath("/dashboard/purchases");
    revalidatePath(`/dashboard/purchases/${purchase.id}`);
    return { ok: true, purchaseId: purchase.id };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function receivePurchaseAction(
  input: unknown,
): Promise<ActionResult> {
  try {
    const data = receivePurchaseSchema.parse(input);
    const tenant = await requireTenantContext();
    await purchaseService.receivePurchase(tenant, data.purchaseId);
    revalidatePath("/dashboard/purchases");
    revalidatePath(`/dashboard/purchases/${data.purchaseId}`);
    revalidatePath("/dashboard/ingredients");
    return { ok: true, purchaseId: data.purchaseId };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
