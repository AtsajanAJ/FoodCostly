import { prisma } from "@/lib/db";

export async function listCategories(organizationId: string, includeArchived = false) {
  return prisma.ingredientCategory.findMany({
    where: {
      organizationId,
      ...(includeArchived ? {} : { archivedAt: null }),
    },
    orderBy: { name: "asc" },
  });
}

export async function getCategoryForOrg(organizationId: string, categoryId: string) {
  return prisma.ingredientCategory.findFirst({
    where: { id: categoryId, organizationId },
  });
}

export async function createCategory(data: {
  id: string;
  organizationId: string;
  name: string;
}) {
  return prisma.ingredientCategory.create({ data });
}

export async function archiveCategory(organizationId: string, categoryId: string) {
  return prisma.ingredientCategory.updateMany({
    where: { id: categoryId, organizationId, archivedAt: null },
    data: { archivedAt: new Date() },
  });
}
