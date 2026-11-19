import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";

export async function listSaleChannels(organizationId: string) {
  return prisma.saleChannel.findMany({
    where: { organizationId, status: "ACTIVE" },
    orderBy: { code: "asc" },
  });
}

export async function getSaleChannelForOrg(
  organizationId: string,
  channelId: string,
) {
  return prisma.saleChannel.findFirst({
    where: { id: channelId, organizationId, status: "ACTIVE" },
  });
}

export async function ensureDefaultChannels(organizationId: string) {
  const existing = await listSaleChannels(organizationId);
  if (existing.some((channel) => channel.code === "INSTORE") &&
    existing.some((channel) => channel.code === "DELIVERY")) {
    return existing;
  }

  // createMany + skipDuplicates avoids P2002 races when the dashboard
  // and other callers seed channels concurrently for a new org.
  await prisma.saleChannel.createMany({
    data: [
      {
        id: randomUUID(),
        organizationId,
        code: "INSTORE",
        name: "In-store",
        feeType: "NONE",
        feeValue: "0",
      },
      {
        id: randomUUID(),
        organizationId,
        code: "DELIVERY",
        name: "Delivery",
        feeType: "PERCENT",
        feeValue: "0",
      },
    ],
    skipDuplicates: true,
  });

  return listSaleChannels(organizationId);
}

export async function updateSaleChannelFee(
  organizationId: string,
  channelId: string,
  data: {
    feeType: "NONE" | "PERCENT" | "FIXED";
    feeValue: string;
  },
) {
  return prisma.saleChannel.updateMany({
    where: { id: channelId, organizationId, status: "ACTIVE" },
    data: {
      feeType: data.feeType,
      feeValue: data.feeValue,
    },
  });
}

export async function listSales(organizationId: string) {
  return prisma.sale.findMany({
    where: { organizationId },
    include: {
      channel: true,
      items: {
        include: { menuItem: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { soldAt: "desc" },
    take: 100,
  });
}

export async function getSaleForOrg(organizationId: string, saleId: string) {
  return prisma.sale.findFirst({
    where: { id: saleId, organizationId },
    include: {
      channel: true,
      items: {
        include: { menuItem: true, recipe: true, recipeVersion: true },
        orderBy: { createdAt: "asc" },
      },
      consumptions: {
        include: { ingredient: true },
        orderBy: { ingredientId: "asc" },
      },
    },
  });
}

export async function findSaleByIdempotencyKey(
  organizationId: string,
  idempotencyKey: string,
) {
  return prisma.sale.findFirst({
    where: { organizationId, idempotencyKey },
    include: {
      channel: true,
      items: {
        include: { menuItem: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}
