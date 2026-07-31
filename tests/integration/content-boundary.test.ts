import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { closeDb, getDb } from "@/db/client";
import { entries, entryRevisions, user } from "@/db/schema";
import {
  capturePublicRead,
  findPublicEntryBySlug,
  listPublicEntries,
} from "@/db/queries/public";
import { createEntry, updateEntry } from "@/features/entries/repository";
import {
  entryInputSchema,
  newEntryDefaults,
} from "@/features/entries/entry-validation";

const editorId = "00000000-0000-4000-8000-000000000001";
const completeTranslation = {
  politeSentence: "A synthetic polite sentence.",
  translation: "A synthetic translation.",
  systemUnderneath: "A synthetic system.",
  usefulPrinciple: "A synthetic useful principle.",
};

function input(
  overrides: Partial<ReturnType<typeof newEntryDefaults>> & {
    slug: string;
    title: string;
  },
) {
  return entryInputSchema.parse({ ...newEntryDefaults(), ...overrides });
}

describe("PostgreSQL content boundary", () => {
  beforeAll(async () => {
    await migrate(getDb(), { migrationsFolder: "drizzle" });
    await getDb().execute(
      sql`TRUNCATE TABLE entry_revisions, entries, rate_limit, session, account, verification, "user" CASCADE`,
    );
    await getDb().insert(user).values({
      id: editorId,
      name: "Synthetic Editor",
      email: "editor@example.test",
      emailVerified: true,
    });
  });

  afterAll(async () => {
    await closeDb();
  });

  it("creates private content and its first revision", async () => {
    const created = await createEntry(
      input({ slug: "private-synthetic", title: "Private synthetic" }),
      editorId,
    );
    expect(created.visibility).toBe("private");
    const revisions = await getDb()
      .select()
      .from(entryRevisions)
      .where(sql`${entryRevisions.entryId} = ${created.id}`);
    expect(revisions).toHaveLength(1);
  });

  it("persists an incomplete private translation", async () => {
    const created = await createEntry(
      input({
        slug: "partial-private-translation",
        title: "Partial private translation",
        kind: "translation",
        politeSentence: "Only a starting sentence.",
      }),
      editorId,
    );
    expect(created.visibility).toBe("private");
    expect(created.translation).toBeNull();
  });

  it("excludes private and draft while returning public content", async () => {
    await createEntry(
      input({
        slug: "draft-synthetic",
        title: "Draft synthetic",
        visibility: "draft",
      }),
      editorId,
    );
    const published = await createEntry(
      input({
        slug: "public-synthetic",
        title: "Public synthetic",
        kind: "essay",
        visibility: "public",
        publicationReviewed: true,
      }),
      editorId,
    );
    const publicRows = await listPublicEntries();
    expect(publicRows.map((entry) => entry.slug)).toEqual(["public-synthetic"]);
    expect(
      await findPublicEntryBySlug("private-synthetic", "essay"),
    ).toBeNull();

    await updateEntry(
      published.id,
      input({
        slug: published.slug,
        title: published.title,
        kind: "essay",
        visibility: "draft",
      }),
      editorId,
    );
    expect(await findPublicEntryBySlug("public-synthetic", "essay")).toBeNull();
  });

  it("rejects unsupported public kinds and incomplete public translations at the mutation boundary", async () => {
    const unsupported = {
      ...newEntryDefaults(),
      slug: "unsafe-public-autopsy",
      title: "Unsafe public autopsy",
      kind: "autopsy",
      visibility: "public",
      publicationReviewed: true,
    } as ReturnType<typeof newEntryDefaults>;
    await expect(createEntry(unsupported, editorId)).rejects.toThrow(
      "This entry kind does not have a public route yet.",
    );

    const incomplete = {
      ...newEntryDefaults(),
      slug: "incomplete-public-translation",
      title: "Incomplete public translation",
      kind: "translation",
      visibility: "public",
      publicationReviewed: true,
    } as ReturnType<typeof newEntryDefaults>;
    await expect(createEntry(incomplete, editorId)).rejects.toThrow(
      "required for a public translation",
    );
    expect(
      await getDb()
        .select()
        .from(entries)
        .where(
          sql`${entries.slug} IN ('unsafe-public-autopsy', 'incomplete-public-translation')`,
        ),
    ).toHaveLength(0);
  });

  it("preserves publication time on public edit and assigns a new time on republication", async () => {
    const published = await createEntry(
      input({
        slug: "chronology-translation",
        title: "Chronology translation",
        kind: "translation",
        visibility: "public",
        publicationReviewed: true,
        ...completeTranslation,
      }),
      editorId,
    );
    const originalPublishedAt = published.publishedAt;
    const originalReviewAt = published.publicationReviewedAt;
    await new Promise((resolve) => setTimeout(resolve, 5));

    const edited = await updateEntry(
      published.id,
      input({
        slug: published.slug,
        title: "Chronology translation corrected",
        kind: "translation",
        visibility: "public",
        publicationReviewed: true,
        ...completeTranslation,
      }),
      editorId,
    );
    expect(edited.publishedAt).toEqual(originalPublishedAt);
    expect(edited.publicationReviewedAt?.getTime()).toBeGreaterThan(
      originalReviewAt?.getTime() ?? 0,
    );

    const withdrawn = await updateEntry(
      published.id,
      input({
        slug: published.slug,
        title: edited.title,
        kind: "translation",
        visibility: "draft",
        ...completeTranslation,
      }),
      editorId,
    );
    expect(withdrawn.publishedAt).toEqual(originalPublishedAt);
    expect(
      await findPublicEntryBySlug(published.slug, "translation"),
    ).toBeNull();

    await new Promise((resolve) => setTimeout(resolve, 5));
    const republished = await updateEntry(
      published.id,
      input({
        slug: published.slug,
        title: edited.title,
        kind: "translation",
        visibility: "public",
        publicationReviewed: true,
        ...completeTranslation,
      }),
      editorId,
    );
    expect(republished.publishedAt?.getTime()).toBeGreaterThan(
      originalPublishedAt?.getTime() ?? 0,
    );
    const revisions = await getDb()
      .select()
      .from(entryRevisions)
      .where(sql`${entryRevisions.entryId} = ${published.id}`);
    expect(revisions).toHaveLength(4);
  });

  it("does not anonymously expose a historical unsupported public kind", async () => {
    await getDb().insert(entries).values({
      slug: "historical-public-autopsy",
      title: "Historical unsupported kind",
      kind: "autopsy",
      visibility: "public",
      publicationReviewedAt: new Date(),
      publicationReviewedBy: editorId,
      publishedAt: new Date(),
    });
    expect(
      (await listPublicEntries()).some(
        (entry) => entry.slug === "historical-public-autopsy",
      ),
    ).toBe(false);
  });

  it("requires acknowledgment and enforces unique slugs", async () => {
    expect(
      entryInputSchema.safeParse({
        ...newEntryDefaults(),
        slug: "review-missing",
        title: "Review missing",
        visibility: "public",
      }).success,
    ).toBe(false);
    await expect(
      createEntry(
        input({ slug: "private-synthetic", title: "Duplicate slug" }),
        editorId,
      ),
    ).rejects.toThrow();
  });

  it("rolls back the entry write when revision creation cannot complete", async () => {
    const created = await createEntry(
      input({ slug: "rollback-synthetic", title: "Before rollback" }),
      editorId,
    );
    await expect(
      updateEntry(
        created.id,
        input({ slug: created.slug, title: "After rollback" }),
        editorId,
        { testFaultAfterEntryWrite: true },
      ),
    ).rejects.toThrow("Synthetic transaction fault");
    const [persisted] = await getDb()
      .select()
      .from(entries)
      .where(sql`${entries.id} = ${created.id}`);
    expect(persisted?.title).toBe("Before rollback");
    const revisions = await getDb()
      .select()
      .from(entryRevisions)
      .where(sql`${entryRevisions.entryId} = ${created.id}`);
    expect(revisions).toHaveLength(1);
  });

  it("does not log a content body when a save fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const syntheticBody = "SYNTHETIC_BODY_MUST_NOT_BE_LOGGED";
    await expect(
      updateEntry(
        "00000000-0000-4000-8000-000000000099",
        input({
          slug: "missing-synthetic",
          title: "Missing synthetic",
          body: syntheticBody,
        }),
        editorId,
      ),
    ).rejects.toThrow();
    expect(JSON.stringify(log.mock.calls)).not.toContain(syntheticBody);
  });

  it("turns a real database connection failure into a typed unavailable state", async () => {
    const postgres = (await import("postgres")).default;
    const broken = postgres(
      "postgresql://synthetic:synthetic@127.0.0.1:1/unreachable",
      { connect_timeout: 1, max: 1 },
    );
    const diagnostics: unknown[] = [];
    try {
      const result = await capturePublicRead(
        async () => broken`SELECT 1`,
        { operation: "list", entryKind: "all" },
        (diagnostic) => diagnostics.push(diagnostic),
      );
      expect(result).toEqual({
        availability: "unavailable",
        reason: "current_read_unavailable",
      });
      expect(diagnostics).toHaveLength(1);
      expect(JSON.stringify(diagnostics)).not.toContain("synthetic:synthetic");
    } finally {
      await broken.end();
    }
  });
});
