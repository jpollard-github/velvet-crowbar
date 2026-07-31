export const PUBLIC_ENTRY_KINDS = ["translation", "essay"] as const;

export type PublicEntryKind = (typeof PUBLIC_ENTRY_KINDS)[number];

export function hasPublicRoute(kind: string): kind is PublicEntryKind {
  return PUBLIC_ENTRY_KINDS.some((candidate) => candidate === kind);
}

export type PublicationState = {
  visibility: "private" | "draft" | "public";
  publishedAt: Date | null;
  publicationReviewedAt: Date | null;
  publicationReviewedBy: string | null;
};

/**
 * Owns publication chronology independently of the database and UI.
 * Withdrawals retain historical fields; only a later transition back to public
 * is a republication and receives a new publication time.
 */
export function nextPublicationState(
  previous: PublicationState | null,
  nextVisibility: PublicationState["visibility"],
  editorId: string,
  now = new Date(),
): PublicationState {
  if (nextVisibility === "public") {
    return {
      visibility: nextVisibility,
      publishedAt:
        previous?.visibility === "public" ? (previous.publishedAt ?? now) : now,
      publicationReviewedAt: now,
      publicationReviewedBy: editorId,
    };
  }

  return {
    visibility: nextVisibility,
    publishedAt: previous?.publishedAt ?? null,
    publicationReviewedAt: previous?.publicationReviewedAt ?? null,
    publicationReviewedBy: previous?.publicationReviewedBy ?? null,
  };
}
