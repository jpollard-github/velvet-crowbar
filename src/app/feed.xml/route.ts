import {
  readPublicEntries,
  requireAvailablePublicRead,
} from "@/db/queries/public";
import { publicEntryPath } from "@/features/entries/paths";
import { PRODUCT_NAME, PRODUCTION_URL, TAGLINE } from "@/lib/constants";

export const dynamic = "force-dynamic";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const entries = requireAvailablePublicRead(await readPublicEntries());
  const items = entries
    .flatMap((entry) => {
      const path = publicEntryPath(entry.kind, entry.slug);
      if (!path) return [];
      const url = `${PRODUCTION_URL}${path}`;
      return [
        `<entry>
  <title>${escapeXml(entry.title)}</title>
  <id>${escapeXml(url)}</id>
  <link href="${escapeXml(url)}" />
  <updated>${(entry.updatedAt ?? entry.publishedAt ?? new Date(0)).toISOString()}</updated>
  <summary>${escapeXml(entry.deck ?? TAGLINE)}</summary>
</entry>`,
      ];
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${PRODUCT_NAME}</title>
  <subtitle>${TAGLINE}</subtitle>
  <id>${PRODUCTION_URL}/</id>
  <link href="${PRODUCTION_URL}/feed.xml" rel="self" />
  <link href="${PRODUCTION_URL}/" />
  <updated>${entries[0]?.updatedAt.toISOString() ?? new Date(0).toISOString()}</updated>
  ${items}
</feed>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/atom+xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=300",
    },
  });
}
