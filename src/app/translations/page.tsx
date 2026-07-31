import type { Metadata } from "next";
import { EntryList } from "@/components/entry-list";
import { PublicReadUnavailable } from "@/components/public-read-unavailable";
import { readPublicEntries } from "@/db/queries/public";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Translations",
  description:
    "Calm public language and the structural translation beneath it.",
};

export default async function TranslationsPage() {
  const entries = await readPublicEntries("translation");
  return (
    <section className="index-page">
      <header className="index-heading">
        <p className="eyebrow">Corporate Translation Manual</p>
        <h1>Translations</h1>
        <p>
          Professional sentences, their concealed meanings, and the durable
          principles worth carrying elsewhere.
        </p>
      </header>
      {entries.availability === "available" ? (
        <EntryList
          entries={entries.data}
          emptyMessage="No translations have been published yet."
        />
      ) : (
        <PublicReadUnavailable />
      )}
    </section>
  );
}
