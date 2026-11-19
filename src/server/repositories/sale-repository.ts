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
  const defaults = [
    {
      code: "INSTORE",
      name: "In-store",
      feeType: "NONE" as const,
      feeValue: "0",
    },
    {
      code: "DELIVERY",
      name: "Delivery",
      feeType: "PERCENT" as const,
      feeValue: "0",
    },
  ];

  for (const channel of defaults) {
    await prisma.saleChannel.upsert({
      where: {
        organizationId_code: {
          organizationId,
          code: channel.code,
        },
      },
      create: {
        id: randomUUID(),
        organizationId,
        code: channel.code,
        name: channel.name,
        feeType: channel.feeType,
        feeValue: channel.feeValue,
      },
      update: {},
    });
  }

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
