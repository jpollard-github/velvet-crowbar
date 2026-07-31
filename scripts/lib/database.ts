import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../src/db/schema";
import { parseServerEnv } from "../../src/lib/env";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

export function openScriptDatabase() {
  const environment = parseServerEnv(process.env);
  const client = postgres(environment.DATABASE_URL, {
    max: 1,
    prepare: false,
  });
  return {
    client,
    db: drizzle(client, { schema }),
    environment,
  };
}
