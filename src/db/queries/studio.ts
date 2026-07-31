import "server-only";

import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { entries, entryRevisions } from "@/db/schema";
import type {
  ENTRY_KINDS,
  VISIBILITIES,
} from "@/features/entries/entry-validation";

type Visibility = (typeof VISIBILITIES)[number];
type Kind = (typeof ENTRY_KINDS)[number];

export async function listStudioEntries(filters: {
  visibility?: Visibility;
  kind?: Kind;
  query?: string;
}) {
  const predicates = [];
  if (filters.visibility)
    predicates.push(eq(entries.visibility, filters.visibility));
  if (filters.kind) predicates.push(eq(entries.kind, filters.kind));
  if (filters.query) {
    const pattern = `%${filters.query.replaceAll("%", "\\%")}%`;
    predicates.push(
      or(
        ilike(entries.title, pattern),
        ilike(entries.slug, pattern),
        sql`${filters.query.toLowerCase()} = ANY(${entries.tags})`,
      )!,
    );
  }
  return getDb()
    .select()
    .from(entries)
    .where(predicates.length ? and(...predicates) : undefined)
    .orderBy(desc(entries.updatedAt));
}

export async function findStudioEntry(id: string) {
  const [entry] = await getDb()
    .select()
    .from(entries)
    .where(eq(entries.id, id))
    .limit(1);
  return entry ?? null;
}

export async function listEntryRevisions(entryId: string) {
  return getDb()
    .select()
    .from(entryRevisions)
    .where(eq(entryRevisions.entryId, entryId))
    .orderBy(desc(entryRevisions.revisionNumber));
}
