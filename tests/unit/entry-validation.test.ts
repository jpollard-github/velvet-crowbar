import { describe, expect, it } from "vitest";
import {
  entryInputSchema,
  entryKindSchema,
  newEntryDefaults,
  slugSchema,
  visibilitySchema,
} from "@/features/entries/entry-validation";
import { publicEntryPath } from "@/features/entries/paths";
import {
  hasPublicRoute,
  nextPublicationState,
  PUBLIC_ENTRY_KINDS,
} from "@/features/entries/publication-policy";

const completeTranslation = {
  politeSentence: "A calm sentence.",
  translation: "A structural translation.",
  systemUnderneath: "A synthetic system.",
  usefulPrinciple: "Keep ownership visible.",
};

describe("entry boundaries", () => {
  it("accepts only fixed kinds and visibility states", () => {
    expect(entryKindSchema.parse("autopsy")).toBe("autopsy");
    expect(entryKindSchema.safeParse("memo").success).toBe(false);
    expect(visibilitySchema.parse("private")).toBe("private");
    expect(visibilitySchema.safeParse("unlisted").success).toBe(false);
  });

  it("uses safe slugs", () => {
    expect(slugSchema.parse("a-diagram-won")).toBe("a-diagram-won");
    for (const slug of ["A Diagram", "../private", "double--hyphen"]) {
      expect(slugSchema.safeParse(slug).success).toBe(false);
    }
  });

  it("defaults every new entry to private", () => {
    expect(newEntryDefaults().visibility).toBe("private");
  });

  it("requires human acknowledgment for public visibility", () => {
    const result = entryInputSchema.safeParse({
      ...newEntryDefaults(),
      title: "Synthetic entry",
      slug: "synthetic-entry",
      visibility: "public",
    });
    expect(result.success).toBe(false);
    expect(
      result.error?.flatten().fieldErrors.publicationReviewed?.[0],
    ).toMatch(/Acknowledge/);
  });

  it("allows only routed kinds to be public", () => {
    expect(PUBLIC_ENTRY_KINDS).toEqual(["translation", "essay"]);
    expect(hasPublicRoute("translation")).toBe(true);
    expect(hasPublicRoute("essay")).toBe(true);
    for (const kind of ["observation", "autopsy", "manifesto", "fragment"]) {
      expect(hasPublicRoute(kind)).toBe(false);
      expect(
        entryInputSchema
          .safeParse({
            ...newEntryDefaults(),
            kind,
            slug: `synthetic-${kind}`,
            title: `Synthetic ${kind}`,
            visibility: "public",
            publicationReviewed: true,
          })
          .error?.flatten().fieldErrors.visibility,
      ).toContain("This entry kind does not have a public route yet.");
      for (const visibility of ["private", "draft"] as const) {
        expect(
          entryInputSchema.safeParse({
            ...newEntryDefaults(),
            kind,
            slug: `synthetic-${kind}`,
            title: `Synthetic ${kind}`,
            visibility,
          }).success,
        ).toBe(true);
      }
    }
  });

  it("allows an incomplete private or draft translation", () => {
    for (const visibility of ["private", "draft"] as const) {
      expect(
        entryInputSchema.safeParse({
          ...newEntryDefaults(),
          kind: "translation",
          slug: `partial-${visibility}`,
          title: "Partial translation",
          visibility,
          politeSentence: "Only one field so far.",
        }).success,
      ).toBe(true);
    }
  });

  it("requires every structured field only for a public translation", () => {
    const base = {
      ...newEntryDefaults(),
      kind: "translation" as const,
      slug: "public-translation",
      title: "Public translation",
      visibility: "public" as const,
      publicationReviewed: true,
    };
    const incomplete = entryInputSchema.safeParse(base);
    expect(incomplete.success).toBe(false);
    expect(Object.keys(incomplete.error?.flatten().fieldErrors ?? {})).toEqual(
      expect.arrayContaining([
        "politeSentence",
        "translation",
        "systemUnderneath",
        "usefulPrinciple",
      ]),
    );
    expect(
      entryInputSchema.safeParse({ ...base, ...completeTranslation }).success,
    ).toBe(true);
  });

  it("preserves chronology on public edits and resets it on republication", () => {
    const firstPublished = new Date("2026-01-01T00:00:00.000Z");
    const first = nextPublicationState(
      null,
      "public",
      "editor-1",
      firstPublished,
    );
    const editedAt = new Date("2026-02-01T00:00:00.000Z");
    const edited = nextPublicationState(first, "public", "editor-2", editedAt);
    expect(edited.publishedAt).toBe(firstPublished);
    expect(edited.publicationReviewedAt).toBe(editedAt);
    expect(edited.publicationReviewedBy).toBe("editor-2");

    const withdrawn = nextPublicationState(edited, "draft", "editor-2");
    expect(withdrawn.publishedAt).toBe(firstPublished);
    const republishedAt = new Date("2026-03-01T00:00:00.000Z");
    const republished = nextPublicationState(
      withdrawn,
      "public",
      "editor-1",
      republishedAt,
    );
    expect(republished.publishedAt).toBe(republishedAt);
  });

  it("generates only supported public detail paths", () => {
    expect(publicEntryPath("translation", "calm-record")).toBe(
      "/translations/calm-record",
    );
    expect(publicEntryPath("essay", "calm-record")).toBe("/essays/calm-record");
    expect(publicEntryPath("autopsy", "calm-record")).toBeNull();
  });
});
