import "server-only";

import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { entries, entryRevisions, type EntrySnapshot } from "@/db/schema";
import { entryInputSchema, type EntryInput } from "./entry-validation";
import { nextPublicationState } from "./publication-policy";

function snapshot(input: EntryInput): EntrySnapshot {
  return {
    title: input.title,
    slug: input.slug,
    kind: input.kind,
    deck: input.deck,
    politeSentence: input.politeSentence,
    translation: input.translation,
    systemUnderneath: input.systemUnderneath,
    usefulPrinciple: input.usefulPrinciple,
    body: input.body,
    tags: input.tags,
    sourceEntryId: input.sourceEntryId,
  };
}

export async function createEntry(input: EntryInput, editorId: string) {
  const validated = entryInputSchema.parse(input);
  return getDb().transaction(async (transaction) => {
    const publication = nextPublicationState(
      null,
      validated.visibility,
      editorId,
    );
    const [entry] = await transaction
      .insert(entries)
      .values({
        slug: validated.slug,
        kind: validated.kind,
        visibility: validated.visibility,
        title: validated.title,
        deck: validated.deck,
        politeSentence: validated.politeSentence,
        translation: validated.translation,
        systemUnderneath: validated.systemUnderneath,
        usefulPrinciple: validated.usefulPrinciple,
        body: validated.body,
        tags: validated.tags,
        sourceEntryId: validated.sourceEntryId,
        publishedAt: publication.publishedAt,
        publicationReviewedAt: publication.publicationReviewedAt,
        publicationReviewedBy: publication.publicationReviewedBy,
      })
      .returning();
    if (!entry) throw new Error("The entry could not be created.");
    await transaction.insert(entryRevisions).values({
      entryId: entry.id,
      revisionNumber: 1,
      snapshot: snapshot(validated),
      visibility: validated.visibility,
    });
    return entry;
  });
}

export async function updateEntry(
  id: string,
  input: EntryInput,
  editorId: string,
  options: { testFaultAfterEntryWrite?: boolean } = {},
) {
  const validated = entryInputSchema.parse(input);
  return getDb().transaction(async (transaction) => {
    const [previous] = await transaction
      .select({
        visibility: entries.visibility,
        publishedAt: entries.publishedAt,
        publicationReviewedAt: entries.publicationReviewedAt,
        publicationReviewedBy: entries.publicationReviewedBy,
      })
      .from(entries)
      .where(eq(entries.id, id))
      .limit(1);
    if (!previous) throw new Error("Entry not found.");

    const publication = nextPublicationState(
      previous,
      validated.visibility,
      editorId,
    );
    const [entry] = await transaction
      .update(entries)
      .set({
        slug: validated.slug,
        kind: validated.kind,
        visibility: validated.visibility,
        title: validated.title,
        deck: validated.deck,
        politeSentence: validated.politeSentence,
        translation: validated.translation,
        systemUnderneath: validated.systemUnderneath,
        usefulPrinciple: validated.usefulPrinciple,
        body: validated.body,
        tags: validated.tags,
        sourceEntryId: validated.sourceEntryId,
        publishedAt: publication.publishedAt,
        publicationReviewedAt: publication.publicationReviewedAt,
        publicationReviewedBy: publication.publicationReviewedBy,
        updatedAt: new Date(),
        version: sql`${entries.version} + 1`,
      })
      .where(eq(entries.id, id))
      .returning();

    if (!entry) throw new Error("Entry not found.");
    if (options.testFaultAfterEntryWrite) {
      throw new Error("Synthetic transaction fault.");
    }

    await transaction.insert(entryRevisions).values({
      entryId: entry.id,
      revisionNumber: entry.version,
      snapshot: snapshot(validated),
      visibility: validated.visibility,
    });
    return entry;
  });
}
