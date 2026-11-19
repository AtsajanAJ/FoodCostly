"use server";

import { revalidatePath } from "next/cache";
import {
  cancelSaleSchema,
  createSaleSchema,
  updateChannelFeeSchema,
} from "@/features/sales/schemas";
import { reportError } from "@/lib/safe-log";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as saleService from "@/server/services/sale-service";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export async function createSaleAction(input: unknown): Promise<ActionResult> {
  try {
    const data = createSaleSchema.parse(input);
    const tenant = await requireTenantContext();
    const sale = await saleService.createSale(tenant, data);
    revalidatePath("/dashboard/sales");
    revalidatePath(`/dashboard/sales/${sale.id}`);
    revalidatePath("/dashboard/inventory");
    return { ok: true, id: sale.id };
  } catch (error) {
    reportError(error, { action: "createSaleAction" });
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function cancelSaleAction(input: unknown): Promise<ActionResult> {
  try {
    const data = cancelSaleSchema.parse(input);
    const tenant = await requireTenantContext();
    const sale = await saleService.cancelSale(
      tenant,
      data.saleId,
      data.cancelReason,
    );
    revalidatePath("/dashboard/sales");
    revalidatePath(`/dashboard/sales/${sale.id}`);
    revalidatePath("/dashboard/inventory");
    return { ok: true, id: sale.id };
  } catch (error) {
    reportError(error, { action: "cancelSaleAction" });
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateChannelFeeAction(
  input: unknown,
): Promise<ActionResult> {
  try {
    const data = updateChannelFeeSchema.parse(input);
    const tenant = await requireTenantContext();
    await saleService.updateChannelFeeForTenant(tenant, data.channelId, {
      feeType: data.feeType,
      feeValue: data.feeValue,
    });
    revalidatePath("/dashboard/sales");
    return { ok: true };
  } catch (error) {
    reportError(error, { action: "updateChannelFeeAction" });
    return { ok: false, error: toErrorMessage(error) };
  }
}
