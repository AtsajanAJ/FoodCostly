import { prisma } from "@/lib/db";

export async function listSuppliers(
  organizationId: string,
  includeArchived = false,
) {
  return prisma.supplier.findMany({
    where: {
      organizationId,
      ...(includeArchived ? {} : { archivedAt: null }),
    },
    orderBy: { name: "asc" },
  });
}

export async function getSupplierForOrg(
  organizationId: string,
  supplierId: string,
) {
  return prisma.supplier.findFirst({
    where: { id: supplierId, organizationId },
  });
}

export async function createSupplier(data: {
  id: string;
  organizationId: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}) {
  return prisma.supplier.create({ data });
}

export async function archiveSupplier(
  organizationId: string,
  supplierId: string,
) {
  return prisma.supplier.updateMany({
    where: { id: supplierId, organizationId, archivedAt: null },
    data: { archivedAt: new Date() },
  });
}
