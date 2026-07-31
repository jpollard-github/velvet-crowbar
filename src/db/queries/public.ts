import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { entries } from "@/db/schema";
import {
  PUBLIC_ENTRY_KINDS,
  type PublicEntryKind,
} from "@/features/entries/publication-policy";

const publicColumns = {
  id: entries.id,
  slug: entries.slug,
  kind: entries.kind,
  title: entries.title,
  deck: entries.deck,
  politeSentence: entries.politeSentence,
  translation: entries.translation,
  systemUnderneath: entries.systemUnderneath,
  usefulPrinciple: entries.usefulPrinciple,
  body: entries.body,
  tags: entries.tags,
  publishedAt: entries.publishedAt,
  updatedAt: entries.updatedAt,
};

export type PublicReadResult<T> =
  | { availability: "available"; data: T }
  | {
      availability: "unavailable";
      reason: "current_read_unavailable";
    };

type PublicReadDiagnostic = {
  event: "public_read_unavailable";
  operation: "list" | "detail";
  entryKind: PublicEntryKind | "all";
  environment: "development" | "preview" | "production" | "unknown";
  errorName: string;
};

function environmentName(): PublicReadDiagnostic["environment"] {
  const candidate = process.env.VERCEL_ENV;
  return candidate === "development" ||
    candidate === "preview" ||
    candidate === "production"
    ? candidate
    : "unknown";
}

function constrainedErrorName(error: unknown) {
  const name = error instanceof Error ? error.name : "UnknownError";
  return /^[A-Za-z][A-Za-z0-9]{0,39}$/.test(name) ? name : "UnknownError";
}

export function publicReadDiagnostic(
  operation: PublicReadDiagnostic["operation"],
  entryKind: PublicReadDiagnostic["entryKind"],
  error: unknown,
): PublicReadDiagnostic {
  return {
    event: "public_read_unavailable",
    operation,
    entryKind,
    environment: environmentName(),
    errorName: constrainedErrorName(error),
  };
}

export async function capturePublicRead<T>(
  read: () => Promise<T>,
  context: Pick<PublicReadDiagnostic, "operation" | "entryKind">,
  log: (diagnostic: PublicReadDiagnostic) => void = (diagnostic) =>
    console.error(diagnostic),
): Promise<PublicReadResult<T>> {
  try {
    return { availability: "available", data: await read() };
  } catch (error) {
    log(publicReadDiagnostic(context.operation, context.entryKind, error));
    return {
      availability: "unavailable",
      reason: "current_read_unavailable",
    };
  }
}

/**
 * Raw public queries keep the visibility and supported-route predicates in SQL.
 * Routes should normally use the typed read helpers below so outages cannot be
 * confused with an empty publication or a missing entry.
 */
export async function listPublicEntries(kind?: PublicEntryKind, limit = 50) {
  const conditions = kind
    ? and(eq(entries.visibility, "public"), eq(entries.kind, kind))
    : and(
        eq(entries.visibility, "public"),
        inArray(entries.kind, PUBLIC_ENTRY_KINDS),
      );

  return getDb()
    .select(publicColumns)
    .from(entries)
    .where(conditions)
    .orderBy(desc(entries.publishedAt))
    .limit(limit);
}

export type PublicEntry = Awaited<ReturnType<typeof listPublicEntries>>[number];

export async function findPublicEntryBySlug(
  slug: string,
  kind: PublicEntryKind,
) {
  const [entry] = await getDb()
    .select(publicColumns)
    .from(entries)
    .where(
      and(
        eq(entries.visibility, "public"),
        eq(entries.kind, kind),
        eq(entries.slug, slug),
      ),
    )
    .limit(1);
  return entry ?? null;
}

export function readPublicEntries(kind?: PublicEntryKind, limit?: number) {
  return capturePublicRead(() => listPublicEntries(kind, limit), {
    operation: "list",
    entryKind: kind ?? "all",
  });
}

export function readPublicEntry(slug: string, kind: PublicEntryKind) {
  return capturePublicRead(() => findPublicEntryBySlug(slug, kind), {
    operation: "detail",
    entryKind: kind,
  });
}

export class PublicReadUnavailableError extends Error {
  constructor() {
    super("Public content is temporarily unavailable.");
    this.name = "PublicReadUnavailableError";
  }
}

export function requireAvailablePublicRead<T>(result: PublicReadResult<T>): T {
  if (result.availability === "unavailable") {
    throw new PublicReadUnavailableError();
  }
  return result.data;
}
