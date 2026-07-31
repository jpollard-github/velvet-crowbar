import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { StudioEntryForm } from "@/components/studio-entry-form";
import { findStudioEntry, listEntryRevisions } from "@/db/queries/studio";
import { updateEntryAction } from "@/features/entries/actions";

export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await findStudioEntry(id);
  if (!entry) notFound();
  const revisions = await listEntryRevisions(id);
  const action = updateEntryAction.bind(null, id, {
    kind: entry.kind,
    slug: entry.slug,
  });
  return (
    <>
      <div className="studio-page-heading">
        <p className="eyebrow">Entry version {entry.version}</p>
        <h2>Edit {entry.title}</h2>
        <p>
          To withdraw a public entry, save it as draft or private. Physical
          deletion is deliberately deferred.
        </p>
        {entry.publishedAt ? (
          <p>
            Publication chronology:{" "}
            <time dateTime={entry.publishedAt.toISOString()}>
              {entry.publishedAt.toISOString()}
            </time>
            . Withdrawal retains this history; republication assigns a new time.
          </p>
        ) : null}
      </div>
      <StudioEntryForm entry={entry} action={action} />
      <section className="revision-history" aria-labelledby="revision-history">
        <h2 id="revision-history">Revision history</h2>
        <p>Append-only snapshots from meaningful saves. Restore is deferred.</p>
        {revisions.map((revision) => (
          <details key={revision.id}>
            <summary>
              Revision {revision.revisionNumber} · {revision.visibility} ·{" "}
              {revision.createdAt.toLocaleString()}
            </summary>
            <dl>
              <dt>Title</dt>
              <dd>{revision.snapshot.title}</dd>
              <dt>Slug</dt>
              <dd>{revision.snapshot.slug}</dd>
            </dl>
            <Markdown>{revision.snapshot.body}</Markdown>
          </details>
        ))}
      </section>
    </>
  );
}
