import { hasPublicRoute, type PublicEntryKind } from "./publication-policy";

export function publicEntryPath(kind: string, slug: string): string | null {
  if (!hasPublicRoute(kind)) return null;
  if (kind === "translation") return `/translations/${slug}`;
  if (kind === "essay") return `/essays/${slug}`;
  return null;
}

export function publicIndexPath(kind: PublicEntryKind) {
  return kind === "translation" ? "/translations" : "/essays";
}
