"use client";

import { useActionState, useState } from "react";
import { Markdown } from "@/components/markdown";
import { PublicationChecklist } from "@/components/publication-checklist";
import { TranslationEntry } from "@/components/translation-entry";
import type { EntryActionState } from "@/features/entries/actions";
import { ENTRY_KINDS, VISIBILITIES } from "@/features/entries/entry-validation";
import { hasPublicRoute } from "@/features/entries/publication-policy";

type EditableEntry = {
  slug: string;
  kind: (typeof ENTRY_KINDS)[number];
  visibility: (typeof VISIBILITIES)[number];
  title: string;
  deck: string | null;
  politeSentence: string | null;
  translation: string | null;
  systemUnderneath: string | null;
  usefulPrinciple: string | null;
  body: string;
  tags: string[];
  version?: number;
  publicationReviewedAt?: Date | null;
};

type EntryAction = (
  state: EntryActionState,
  formData: FormData,
) => Promise<EntryActionState>;

export function StudioEntryForm({
  entry,
  action,
}: {
  entry: EditableEntry;
  action: EntryAction;
}) {
  const [state, formAction, pending] = useActionState(action, {
    status: "idle",
  } satisfies EntryActionState);
  const [draft, setDraft] = useState(entry);
  const [reviewedForRevision, setReviewedForRevision] = useState<number | null>(
    null,
  );
  const errors = state.fieldErrors ?? {};
  const currentRevision = state.savedRevision ?? entry.version ?? 0;
  const reviewed = reviewedForRevision === currentRevision;

  function update<K extends keyof EditableEntry>(
    key: K,
    value: EditableEntry[K],
  ) {
    if (draft.visibility === "public") setReviewedForRevision(null);
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <form className="studio-form" action={formAction}>
      <div className="studio-editor">
        {state.message ? (
          <p className="form-error" role="alert">
            {state.message}
          </p>
        ) : null}
        <div className="field-grid">
          <label>
            Title
            <input
              name="title"
              value={draft.title}
              onChange={(event) => update("title", event.target.value)}
              required
            />
            <FieldErrors messages={errors.title} />
          </label>
          <label>
            Slug
            <input
              name="slug"
              value={draft.slug}
              onChange={(event) => update("slug", event.target.value)}
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            />
            <FieldErrors messages={errors.slug} />
          </label>
          <label>
            Kind
            <select
              name="kind"
              value={draft.kind}
              onChange={(event) =>
                setDraft((current) => {
                  const kind = event.target.value as EditableEntry["kind"];
                  setReviewedForRevision(null);
                  return { ...current, kind };
                })
              }
            >
              {ENTRY_KINDS.map((kind) => (
                <option key={kind}>{kind}</option>
              ))}
            </select>
          </label>
          <label>
            Visibility
            <select
              name="visibility"
              value={draft.visibility}
              onChange={(event) => {
                const visibility = event.target
                  .value as EditableEntry["visibility"];
                update("visibility", visibility);
                if (visibility !== "public") setReviewedForRevision(null);
              }}
            >
              {VISIBILITIES.map((visibility) => (
                <option
                  key={visibility}
                  disabled={
                    visibility === "public" && !hasPublicRoute(draft.kind)
                  }
                >
                  {visibility}
                </option>
              ))}
            </select>
            {!hasPublicRoute(draft.kind) ? (
              <span className="field-hint">
                This kind has no public route and must remain private or draft.
              </span>
            ) : null}
            <FieldErrors messages={errors.visibility} />
          </label>
        </div>
        <label>
          Deck / summary
          <textarea
            name="deck"
            rows={2}
            value={draft.deck ?? ""}
            onChange={(event) => update("deck", event.target.value)}
          />
        </label>
        {draft.kind === "translation" ? (
          <div className="structured-fields">
            <label>
              Polite sentence
              <textarea
                name="politeSentence"
                rows={3}
                value={draft.politeSentence ?? ""}
                onChange={(event) =>
                  update("politeSentence", event.target.value)
                }
              />
              <FieldErrors messages={errors.politeSentence} />
            </label>
            <label>
              Translation
              <textarea
                name="translation"
                rows={3}
                value={draft.translation ?? ""}
                onChange={(event) => update("translation", event.target.value)}
              />
              <FieldErrors messages={errors.translation} />
            </label>
            <label>
              System underneath
              <textarea
                name="systemUnderneath"
                rows={4}
                value={draft.systemUnderneath ?? ""}
                onChange={(event) =>
                  update("systemUnderneath", event.target.value)
                }
              />
              <FieldErrors messages={errors.systemUnderneath} />
            </label>
            <label>
              Useful principle
              <textarea
                name="usefulPrinciple"
                rows={3}
                value={draft.usefulPrinciple ?? ""}
                onChange={(event) =>
                  update("usefulPrinciple", event.target.value)
                }
              />
              <FieldErrors messages={errors.usefulPrinciple} />
            </label>
          </div>
        ) : null}
        <label>
          Markdown body
          <textarea
            className="markdown-editor"
            name="body"
            rows={18}
            value={draft.body}
            onChange={(event) => update("body", event.target.value)}
          />
        </label>
        <label>
          Tags <span className="field-hint">comma-separated slugs</span>
          <input
            name="tags"
            value={draft.tags.join(", ")}
            onChange={(event) =>
              update(
                "tags",
                event.target.value.split(",").map((tag) => tag.trim()),
              )
            }
          />
        </label>
        {draft.visibility === "public" ? (
          <>
            {draft.kind === "translation" ? (
              <p className="field-hint">
                All four structured translation fields are required before
                publication.
              </p>
            ) : null}
            <PublicationChecklist
              checked={reviewed}
              onChange={(checked) =>
                setReviewedForRevision(checked ? currentRevision : null)
              }
              error={errors.publicationReviewed}
            />
          </>
        ) : null}
        <div className="form-actions">
          <button className="button" type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save entry"}
          </button>
          <p>No auto-save. Every meaningful save creates a revision.</p>
        </div>
      </div>
      <aside
        className="studio-preview"
        aria-label="Exact public renderer preview"
      >
        <p className="eyebrow">Renderer preview</p>
        {draft.kind === "translation" ? (
          <TranslationEntry entry={draft} />
        ) : (
          <>
            <header className="document-heading">
              <p className="eyebrow">{draft.kind}</p>
              <h1>{draft.title || "Untitled entry"}</h1>
              {draft.deck ? <p className="deck">{draft.deck}</p> : null}
            </header>
            <Markdown>{draft.body}</Markdown>
          </>
        )}
      </aside>
    </form>
  );
}

function FieldErrors({ messages }: { messages?: string[] }) {
  return messages?.map((message) => (
    <span className="field-error" key={message}>
      {message}
    </span>
  ));
}
