import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnv } from "@/lib/env";
import * as schema from "./schema";

const globalDatabase = globalThis as unknown as {
  velvetCrowbarSql?: ReturnType<typeof postgres>;
  velvetCrowbarDb?: ReturnType<typeof createDatabase>;
};

function createDatabase() {
  const sql = postgres(getServerEnv().DATABASE_URL, {
    max: process.env.NODE_ENV === "development" ? 4 : 1,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  globalDatabase.velvetCrowbarSql = sql;
  return drizzle(sql, { schema });
}

export function getDb() {
  globalDatabase.velvetCrowbarDb ??= createDatabase();
  return globalDatabase.velvetCrowbarDb;
}

export async function closeDb() {
  await globalDatabase.velvetCrowbarSql?.end();
  globalDatabase.velvetCrowbarSql = undefined;
  globalDatabase.velvetCrowbarDb = undefined;
}
