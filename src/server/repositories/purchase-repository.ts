import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export async function listPurchases(organizationId: string) {
  return prisma.purchase.findMany({
    where: { organizationId },
    include: {
      supplier: true,
      lines: true,
    },
    orderBy: [{ purchasedAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function getPurchaseForOrg(
  organizationId: string,
  purchaseId: string,
) {
  return prisma.purchase.findFirst({
    where: { id: purchaseId, organizationId },
    include: {
      supplier: true,
      lines: {
        include: {
          ingredient: true,
          unit: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function createPurchaseWithLines(data: {
  purchase: Prisma.PurchaseUncheckedCreateInput;
  lines: Prisma.PurchaseLineUncheckedCreateInput[];
}) {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.create({ data: data.purchase });
    if (data.lines.length > 0) {
      await tx.purchaseLine.createMany({ data: data.lines });
    }
    return tx.purchase.findFirstOrThrow({
      where: { id: purchase.id, organizationId: purchase.organizationId },
      include: {
        supplier: true,
        lines: {
          include: { ingredient: true, unit: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  });
}

export async function replaceDraftPurchaseLines(params: {
  organizationId: string;
  purchaseId: string;
  purchaseUpdate: Prisma.PurchaseUncheckedUpdateInput;
  lines: Prisma.PurchaseLineUncheckedCreateInput[];
}) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.purchase.findFirst({
      where: {
        id: params.purchaseId,
        organizationId: params.organizationId,
        status: "DRAFT",
      },
    });

    if (!existing) {
      throw new Error("Draft purchase not found");
    }

    await tx.purchase.update({
      where: { id: params.purchaseId },
      data: params.purchaseUpdate,
    });

    await tx.purchaseLine.deleteMany({
      where: {
        purchaseId: params.purchaseId,
        organizationId: params.organizationId,
      },
    });

    if (params.lines.length > 0) {
      await tx.purchaseLine.createMany({ data: params.lines });
    }

    return tx.purchase.findFirstOrThrow({
      where: {
        id: params.purchaseId,
        organizationId: params.organizationId,
      },
      include: {
        supplier: true,
        lines: {
          include: { ingredient: true, unit: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  });
}
