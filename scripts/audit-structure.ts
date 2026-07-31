import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const requiredRoutes = [
  "src/app/page.tsx",
  "src/app/translations/page.tsx",
  "src/app/translations/[slug]/page.tsx",
  "src/app/essays/page.tsx",
  "src/app/essays/[slug]/page.tsx",
  "src/app/about/page.tsx",
  "src/app/sign-in/page.tsx",
  "src/app/studio/page.tsx",
  "src/app/api/health/route.ts",
];
const failures: string[] = [];

for (const path of requiredRoutes) {
  try {
    await stat(join(root, path));
  } catch {
    failures.push(`Missing route implementation: ${path}`);
  }
}

const migrationFiles = (await readdir(join(root, "drizzle"))).filter((file) =>
  file.endsWith(".sql"),
);
if (!migrationFiles.length) failures.push("No generated SQL migration exists.");

async function walk(directory: string): Promise<string[]> {
  const paths: string[] = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    if ([".git", "node_modules", ".next", "artifacts"].includes(item.name))
      continue;
    const absolute = join(directory, item.name);
    if (item.isDirectory()) paths.push(...(await walk(absolute)));
    else paths.push(absolute);
  }
  return paths;
}

for (const file of await walk(root)) {
  const path = relative(root, file);
  if (/^\.env(?:\.|$)/.test(path) && path !== ".env.example") {
    failures.push(
      `Local environment file must not be in the repository: ${path}`,
    );
  }
  if (/src\/app\/.*(?:page|route)\.tsx?$/.test(path)) {
    const lines = (await readFile(file, "utf8")).split("\n").length;
    if (lines > 350)
      failures.push(`Route is a dumping ground (${lines} lines): ${path}`);
  }
}

const seed = await readFile(join(root, "scripts/db-seed.ts"), "utf8");
for (const forbidden of [
  "PRIVATE_FIXTURE_SECRET",
  "REAL_EMPLOYER_NAME",
  "INTERNAL_SYSTEM_URL",
]) {
  if (seed.includes(forbidden))
    failures.push(
      `Forbidden private fixture marker in public seed: ${forbidden}`,
    );
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Structure audit passed (${requiredRoutes.length} routes, ${migrationFiles.length} migration set).`,
  );
}
