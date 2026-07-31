import { spawnSync } from "node:child_process";
import { join } from "node:path";

const executable =
  process.platform === "win32"
    ? join(process.cwd(), "node_modules", ".bin", "tsc.cmd")
    : join(process.cwd(), "node_modules", ".bin", "tsc");
const result = spawnSync(
  executable,
  ["--noEmit", "--noUnusedLocals", "--noUnusedParameters"],
  { stdio: "inherit" },
);

if (result.status !== 0) {
  process.exitCode = result.status ?? 1;
} else {
  console.log("Unused-code audit passed (TypeScript symbol analysis).");
}
