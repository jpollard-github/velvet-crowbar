import type { PublicEntry } from "@/db/queries/public";

export type SafePublicMetadata = {
  title: string;
  description: string;
  slug: string;
  publishedAt: Date | null;
};

export function publicMetadata(entry: PublicEntry): SafePublicMetadata {
  return {
    title: entry.title,
    description: entry.deck ?? "Calm language for difficult systems.",
    slug: entry.slug,
    publishedAt: entry.publishedAt,
  };
}
