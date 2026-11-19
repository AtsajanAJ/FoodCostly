import { randomUUID } from "node:crypto";
import { assertCanWriteMasterData } from "@/server/permissions/roles";
import type { TenantContext } from "@/server/permissions/tenant-context";
import * as supplierRepository from "@/server/repositories/supplier-repository";

export async function listSuppliersForTenant(
  tenant: TenantContext,
  includeArchived = false,
) {
  return supplierRepository.listSuppliers(tenant.organizationId, includeArchived);
}

export async function createSupplierForTenant(
  tenant: TenantContext,
  input: {
    name: string;
    contactName?: string | null;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
  },
) {
  assertCanWriteMasterData(tenant.role);

  const name = input.name.trim();
  if (!name) {
    throw new Error("Supplier name is required");
  }

  return supplierRepository.createSupplier({
    id: randomUUID(),
    organizationId: tenant.organizationId,
    name,
    contactName: input.contactName?.trim() || null,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    notes: input.notes?.trim() || null,
  });
}

export async function archiveSupplierForTenant(
  tenant: TenantContext,
  supplierId: string,
) {
  assertCanWriteMasterData(tenant.role);

  const existing = await supplierRepository.getSupplierForOrg(
    tenant.organizationId,
    supplierId,
  );

  if (!existing) {
    throw new Error("Supplier not found");
  }

  await supplierRepository.archiveSupplier(tenant.organizationId, supplierId);
}
