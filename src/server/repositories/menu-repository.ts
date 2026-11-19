import { prisma } from "@/lib/db";

export async function listMenuItems(organizationId: string) {
  return prisma.menuItem.findMany({
    where: { organizationId, status: "ACTIVE" },
    include: {
      recipe: {
        include: {
          versions: {
            orderBy: { versionNumber: "desc" },
            take: 1,
          },
        },
      },
      recipeVersion: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function createMenuItem(data: {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  recipeId: string;
  recipeVersionId?: string | null;
  priceInStore?: string | null;
  priceDelivery?: string | null;
}) {
  return prisma.menuItem.create({
    data: {
      id: data.id,
      organizationId: data.organizationId,
      name: data.name,
      description: data.description ?? null,
      recipeId: data.recipeId,
      recipeVersionId: data.recipeVersionId ?? null,
      priceInStore: data.priceInStore,
      priceDelivery: data.priceDelivery,
    },
    include: {
      recipe: true,
      recipeVersion: true,
    },
  });
}

export async function archiveMenuItem(
  organizationId: string,
  menuItemId: string,
) {
  return prisma.menuItem.updateMany({
    where: { id: menuItemId, organizationId, status: "ACTIVE" },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });
}
