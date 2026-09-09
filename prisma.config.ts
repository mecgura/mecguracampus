import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  // Local dev uses prisma/schema.prisma (SQLite).
  // Production/Vercel sets PRISMA_SCHEMA=prisma/schema.postgres.prisma (PostgreSQL).
  schema: process.env.PRISMA_SCHEMA ?? "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Fallback keeps `prisma generate` working even when DATABASE_URL
    // is not set yet (e.g. first Vercel build before env vars are added).
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  },
});
