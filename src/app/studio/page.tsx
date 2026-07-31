import Link from "next/link";
import { listStudioEntries } from "@/db/queries/studio";
import {
  ENTRY_KINDS,
  entryKindSchema,
  VISIBILITIES,
  visibilitySchema,
} from "@/features/entries/entry-validation";

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{
    visibility?: string;
    kind?: string;
    query?: string;
  }>;
}) {
  const filters = await searchParams;
  const visibility = visibilitySchema.safeParse(filters.visibility);
  const kind = entryKindSchema.safeParse(filters.kind);
  const entries = await listStudioEntries({
    visibility: visibility.success ? visibility.data : undefined,
    kind: kind.success ? kind.data : undefined,
    query: filters.query?.trim() || undefined,
  });
  return (
    <>
      <form className="studio-filters">
        <label>
          Visibility
          <select name="visibility" defaultValue={filters.visibility ?? ""}>
            <option value="">All</option>
            {VISIBILITIES.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Kind
          <select name="kind" defaultValue={filters.kind ?? ""}>
            <option value="">All</option>
            {ENTRY_KINDS.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Text or exact tag
          <input name="query" defaultValue={filters.query ?? ""} />
        </label>
        <button className="button-secondary" type="submit">
          Filter
        </button>
      </form>
      <div className="studio-table-wrap">
        <table className="studio-table">
          <thead>
            <tr>
              <th>Entry</th>
              <th>Kind</th>
              <th>Visibility</th>
              <th>Version</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <Link href={`/studio/entries/${entry.id}`}>
                    {entry.title}
                  </Link>
                  <small>{entry.slug}</small>
                </td>
                <td>{entry.kind}</td>
                <td>
                  <span className={`visibility visibility-${entry.visibility}`}>
                    {entry.visibility}
                  </span>
                </td>
                <td>{entry.version}</td>
                <td>{entry.updatedAt.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!entries.length ? (
        <p className="empty-state">
          No entries match.{" "}
          <Link href="/studio/new">Create a private entry.</Link>
        </p>
      ) : null}
    </>
  );
}
