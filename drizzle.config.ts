import { defineConfig } from "drizzle-kit";
import { connectionFromUrl } from "./db/connection";

if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");

export default defineConfig({
  dialect: "mysql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dbCredentials: connectionFromUrl(process.env.DATABASE_URL!),
});
