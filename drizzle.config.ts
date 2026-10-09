import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");

export default defineConfig({
  dialect: "mysql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
