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
    // Use pooled connection for runtime
    url: process.env["DATABASE_URL"],
  },
});
