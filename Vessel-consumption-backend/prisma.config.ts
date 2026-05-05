import "dotenv/config";
import { defineConfig, env } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node --env-file=.env --import tsx/esm prisma/seed.js",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
  adapter: () =>
    new PrismaPg({
      connectionString: env("DATABASE_URL"),
    }),
});