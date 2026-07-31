import Link from "next/link";
import type { PublicEntry } from "@/db/queries/public";
import { publicEntryPath } from "@/features/entries/paths";

export function EntryList({
  entries,
  emptyMessage,
}: {
  entries: PublicEntry[];
  emptyMessage: string;
}) {
  if (!entries.length) {
    return <p className="empty-state">{emptyMessage}</p>;
  }
  return (
    <ol className="entry-list">
      {entries.map((entry) => {
        const path = publicEntryPath(entry.kind, entry.slug);
        if (!path) return null;
        return (
          <li key={entry.id}>
            <p className="entry-meta">
              {entry.kind} ·{" "}
              {entry.publishedAt?.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <h2>
              <Link href={path}>{entry.title}</Link>
            </h2>
            {entry.deck ? <p>{entry.deck}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}
