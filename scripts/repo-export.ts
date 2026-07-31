import {
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const exportRoot = join(root, "artifacts", "exports");

const excludedSegments = new Set([
  ".git",
  ".next",
  ".vercel",
  "node_modules",
  "coverage",
  "playwright-report",
  "test-results",
  ".data",
  "postgres-data",
]);

export function isIncludedPath(path: string) {
  const normalized = path.replaceAll("\\", "/");
  const segments = normalized.split("/");
  if (segments.some((segment) => excludedSegments.has(segment))) return false;
  if (normalized.startsWith("artifacts/exports/")) return false;
  if (/^codex-prompt-.*\.md$/.test(segments.at(-1) ?? "")) return false;
  if (/(^|\/)\.env(?:\.|$)/.test(normalized) && normalized !== ".env.example") {
    return false;
  }
  if (/\.(?:log|dump|sql\.gz)$/.test(normalized)) return false;
  if (normalized.endsWith(".tsbuildinfo")) return false;
  if (/(^|\/)(?:\.DS_Store|Thumbs\.db)$/.test(normalized)) return false;
  return true;
}

async function walk(directory: string): Promise<string[]> {
  const output: string[] = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const absolute = join(directory, item.name);
    const path = relative(root, absolute);
    if (!isIncludedPath(path)) continue;
    if (item.isDirectory()) output.push(...(await walk(absolute)));
    else if (item.isFile()) output.push(path.replaceAll("\\", "/"));
  }
  return output;
}

function git(...args: string[]) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "";
}

async function hashFile(path: string) {
  const data = await import("node:fs/promises").then(({ readFile }) =>
    readFile(path),
  );
  return createHash("sha256").update(data).digest("hex");
}

export async function collectExportState() {
  const files = (await walk(root)).sort();
  const records = await Promise.all(
    files.map(async (path) => ({
      path,
      size: (await stat(join(root, path))).size,
    })),
  );
  return {
    timestamp: new Date().toISOString(),
    branch: git("branch", "--show-current") || "unborn",
    commit: git("rev-parse", "HEAD") || "no commits",
    dirty: git("status", "--porcelain").length > 0,
    fileCount: records.length,
    files: records,
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const state = await collectExportState();
  console.log(
    JSON.stringify(
      {
        mode: dryRun ? "dry-run" : "archive",
        branch: state.branch,
        commit: state.commit,
        dirty: state.dirty,
        fileCount: state.fileCount,
        included: state.files.map((file) => file.path),
        excluded:
          ".git, node_modules, build/test output, secrets, local databases, prior archives, and retained task prompts",
      },
      null,
      2,
    ),
  );
  if (dryRun) return;

  await mkdir(exportRoot, { recursive: true });
  const staging = await mkdtemp(join(tmpdir(), "velvet-crowbar-export-"));
  try {
    for (const file of state.files) {
      const destination = join(staging, file.path);
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(join(root, file.path), destination);
    }
    const manifest = {
      ...state,
      note: "This is a source review archive. It does not back up database-resident private content.",
    };
    await writeFile(
      join(staging, "REVIEW-MANIFEST.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8",
    );
    const stamp = state.timestamp.replaceAll(/[:.]/g, "-");
    const archive = join(exportRoot, `velvet-crowbar-review-${stamp}.tar.gz`);
    const tar = spawnSync("tar", ["-czf", archive, "-C", staging, "."], {
      encoding: "utf8",
    });
    if (tar.status !== 0) throw new Error(tar.stderr || "tar failed");
    const archiveStat = await stat(archive);
    const sha256 = await hashFile(archive);
    console.log(
      JSON.stringify(
        {
          path: relative(root, archive),
          size: archiveStat.size,
          fileCount: state.fileCount + 1,
          sha256,
          branch: state.branch,
          commit: state.commit,
          dirty: state.dirty,
        },
        null,
        2,
      ),
    );
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

if (basename(process.argv[1] ?? "") === "repo-export.ts") {
  await main();
}
