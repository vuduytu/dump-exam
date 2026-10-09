import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";
import { connectionFromUrl } from "./connection";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

export const db = drizzle(createPool(connectionFromUrl(process.env.DATABASE_URL)), {
  schema,
  mode: "default",
});
