import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "packages/db/prisma/schema.prisma",
  migrations: {
    path: "packages/db/prisma/migrations",
    seed: "pnpm --filter @event-booking/db exec tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});