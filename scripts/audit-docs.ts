import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const root = process.cwd();
const required = [
  "README.md",
  "AGENTS.md",
  "SECURITY.md",
  "docs/ARCHITECTURE.md",
  "docs/CHANGE-RECIPES.md",
  "docs/DESIGN-BRIEF.md",
  "docs/EDITORIAL-MODEL.md",
  "docs/ENVIRONMENTS.md",
  "docs/ROADMAP.md",
  "docs/SECURITY-AND-PRIVACY.md",
];

async function markdownFiles(directory: string): Promise<string[]> {
  const output: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (["node_modules", ".git", ".next", "artifacts"].includes(entry.name))
      continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...(await markdownFiles(path)));
    if (
      entry.isFile() &&
      entry.name.endsWith(".md") &&
      !entry.name.startsWith("codex-prompt-")
    )
      output.push(path);
  }
  return output;
}

const packageJson = JSON.parse(
  await readFile(join(root, "package.json"), "utf8"),
) as { scripts: Record<string, string> };
const failures: string[] = [];

for (const path of required) {
  try {
    await stat(join(root, path));
  } catch {
    failures.push(`Missing required document: ${path}`);
  }
}

for (const file of await markdownFiles(root)) {
  const text = await readFile(file, "utf8");
  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1]?.split("#")[0];
    if (
      !target ||
      target.startsWith("http") ||
      target.startsWith("mailto:") ||
      target.startsWith("/")
    )
      continue;
    try {
      await stat(resolve(dirname(file), target));
    } catch {
      failures.push(
        `Broken local link in ${file.slice(root.length + 1)}: ${target}`,
      );
    }
  }
  for (const match of text.matchAll(/`pnpm ([a-z][\w:-]+)/g)) {
    const command = match[1]!;
    if (["install", "exec", "dlx"].includes(command)) continue;
    if (!packageJson.scripts[command]) {
      failures.push(
        `Documented pnpm command has no package script: ${command} (${file.slice(root.length + 1)})`,
      );
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Documentation audit passed (${required.length} required files).`,
  );
}
