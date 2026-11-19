import { prisma } from "@/lib/db";

export async function listStockBalances(organizationId: string) {
  return prisma.stockBalance.findMany({
    where: { organizationId },
    include: {
      ingredient: {
        include: {
          baseUnit: true,
        },
      },
    },
    orderBy: {
      ingredient: { name: "asc" },
    },
  });
}

export async function listLedgerEntries(
  organizationId: string,
  options?: { ingredientId?: string; take?: number },
) {
  return prisma.inventoryLedgerEntry.findMany({
    where: {
      organizationId,
      ...(options?.ingredientId
        ? { ingredientId: options.ingredientId }
        : {}),
    },
    include: {
      ingredient: {
        include: { baseUnit: true },
      },
    },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    take: options?.take ?? 100,
  });
}

export async function sumLedgerQuantity(
  organizationId: string,
  ingredientId: string,
) {
  const aggregates = await prisma.inventoryLedgerEntry.aggregate({
    where: { organizationId, ingredientId },
    _sum: { quantityBase: true },
  });
  return aggregates._sum.quantityBase;
}
