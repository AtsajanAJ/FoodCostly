import { prisma } from "@/lib/db";

export async function listUnits() {
  return prisma.unit.findMany({
    orderBy: [{ dimension: "asc" }, { isBase: "desc" }, { code: "asc" }],
  });
}

export async function getUnitById(id: string) {
  return prisma.unit.findUnique({ where: { id } });
}

export async function getUnitByCode(code: string) {
  return prisma.unit.findUnique({ where: { code } });
}
