import type { MetadataRoute } from "next";
import {
  readPublicEntries,
  requireAvailablePublicRead,
} from "@/db/queries/public";
import { publicEntryPath } from "@/features/entries/paths";
import { PRODUCTION_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed: MetadataRoute.Sitemap = [
    "",
    "/translations",
    "/essays",
    "/about",
  ].map((path) => ({
    url: `${PRODUCTION_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const entries = requireAvailablePublicRead(await readPublicEntries());
  return [
    ...fixed,
    ...entries.flatMap((entry) => {
      const path = publicEntryPath(entry.kind, entry.slug);
      return path
        ? [
            {
              url: `${PRODUCTION_URL}${path}`,
              lastModified: entry.updatedAt,
              changeFrequency: "monthly" as const,
              priority: 0.6,
            },
          ]
        : [];
    }),
  ];
}
