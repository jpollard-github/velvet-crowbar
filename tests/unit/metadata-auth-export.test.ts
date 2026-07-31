import { describe, expect, it } from "vitest";
import { publicMetadata } from "@/features/entries/public-metadata";
import { isConfiguredEditor } from "@/lib/editor-identity";
import { isIncludedPath } from "../../scripts/repo-export";

describe("metadata, editor identity, and export boundaries", () => {
  it("projects only public metadata fields", () => {
    const metadata = publicMetadata({
      id: "00000000-0000-4000-8000-000000000000",
      slug: "synthetic-public",
      kind: "essay",
      title: "Synthetic public",
      deck: null,
      politeSentence: null,
      translation: null,
      systemUnderneath: null,
      usefulPrinciple: null,
      body: "Public body",
      tags: ["synthetic"],
      publishedAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    });
    expect(Object.keys(metadata).sort()).toEqual([
      "description",
      "publishedAt",
      "slug",
      "title",
    ]);
    expect(JSON.stringify(metadata)).not.toContain("private");
  });

  it("enforces the configured editor email case-insensitively", () => {
    expect(
      isConfiguredEditor("Editor@Example.Test", "editor@example.test"),
    ).toBe(true);
    expect(
      isConfiguredEditor("other@example.test", "editor@example.test"),
    ).toBe(false);
  });

  it("includes source and rejects secret/local/archive paths", () => {
    expect(isIncludedPath("src/app/page.tsx")).toBe(true);
    expect(isIncludedPath(".env.example")).toBe(true);
    for (const path of [
      ".env",
      ".env.local",
      "node_modules/pkg/index.js",
      ".git/config",
      "codex-prompts/codex-prompt-phase-0-1.md",
      "artifacts/exports/old.tar.gz",
      "postgres-data/base",
      "private.sql.gz",
      "tsconfig.tsbuildinfo",
    ]) {
      expect(isIncludedPath(path)).toBe(false);
    }
  });
});
