import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Direct (unpooled) Neon URL for Prisma CLI migrations / introspection
    url: env("DATABASE_URL_UNPOOLED"),
  },
});
