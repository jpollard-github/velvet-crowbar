import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://velvet_crowbar:velvet_crowbar@localhost:54329/velvet_crowbar",
  },
  strict: true,
  verbose: true,
});
