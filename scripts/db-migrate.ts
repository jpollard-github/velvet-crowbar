import { migrate } from "drizzle-orm/postgres-js/migrator";
import { openScriptDatabase } from "./lib/database";

const { db, client } = openScriptDatabase();

try {
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Database migrations applied.");
} finally {
  await client.end();
}
