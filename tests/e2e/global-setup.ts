import { spawnSync } from "node:child_process";
import postgres from "postgres";

const environment = {
  ...process.env,
  DATABASE_URL:
    process.env.DATABASE_URL ??
    "postgresql://velvet_crowbar:velvet_crowbar@localhost:54329/velvet_crowbar",
  BETTER_AUTH_SECRET:
    process.env.BETTER_AUTH_SECRET ??
    "e2e-only-secret-with-at-least-thirty-two-characters",
  BETTER_AUTH_URL: "http://127.0.0.1:3100",
  ADMIN_EMAIL: "editor@example.test",
  ADMIN_BOOTSTRAP_EMAIL: "editor@example.test",
  ADMIN_BOOTSTRAP_PASSWORD: "synthetic-e2e-password-only",
  NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3100",
  VERCEL_ENV: "development",
};

function run(command: string) {
  const result = spawnSync("corepack", ["pnpm", command], {
    cwd: process.cwd(),
    env: environment,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`${command} failed:\n${result.stdout}\n${result.stderr}`);
  }
}

export default async function globalSetup() {
  run("db:migrate");
  const client = postgres(environment.DATABASE_URL, { max: 1, prepare: false });
  try {
    await client`TRUNCATE TABLE entry_revisions, entries, rate_limit, session, account, verification, "user" CASCADE`;
  } finally {
    await client.end();
  }
  run("admin:bootstrap");
  run("db:seed");
}
