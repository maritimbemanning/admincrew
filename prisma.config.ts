// Prisma configuration for AdminCrew V6
// npm install --save-dev prisma dotenv
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use direct connection for migrations (bypasses PgBouncer)
    // In Prisma 7, migrations use DIRECT_URL if set, otherwise DATABASE_URL
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
