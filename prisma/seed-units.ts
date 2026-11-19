import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

const units = [
  {
    id: "unit_g",
    code: "g",
    name: "Gram",
    dimension: "WEIGHT" as const,
    toBaseFactor: "1",
    isBase: true,
  },
  {
    id: "unit_kg",
    code: "kg",
    name: "Kilogram",
    dimension: "WEIGHT" as const,
    toBaseFactor: "1000",
    isBase: false,
  },
  {
    id: "unit_ml",
    code: "ml",
    name: "Millilitre",
    dimension: "VOLUME" as const,
    toBaseFactor: "1",
    isBase: true,
  },
  {
    id: "unit_l",
    code: "l",
    name: "Litre",
    dimension: "VOLUME" as const,
    toBaseFactor: "1000",
    isBase: false,
  },
  {
    id: "unit_pcs",
    code: "pcs",
    name: "Piece",
    dimension: "COUNT" as const,
    toBaseFactor: "1",
    isBase: true,
  },
];

async function main() {
  for (const unit of units) {
    await prisma.unit.upsert({
      where: { code: unit.code },
      create: unit,
      update: {
        name: unit.name,
        dimension: unit.dimension,
        toBaseFactor: unit.toBaseFactor,
        isBase: unit.isBase,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
