import type { Metadata } from "next";
import { EntryList } from "@/components/entry-list";
import { PublicReadUnavailable } from "@/components/public-read-unavailable";
import { readPublicEntries } from "@/db/queries/public";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Essays",
  description:
    "Long-form notes on software delivery and organizational systems.",
};

export default async function EssaysPage() {
  const entries = await readPublicEntries("essay");
  return (
    <section className="index-page">
      <header className="index-heading">
        <p className="eyebrow">Long-form file</p>
        <h1>Essays</h1>
        <p>
          Software boundaries, delivery systems, and the places where a diagram
          mistakes itself for an outcome.
        </p>
      </header>
      {entries.availability === "available" ? (
        <EntryList
          entries={entries.data}
          emptyMessage="No essays are public yet."
        />
      ) : (
        <PublicReadUnavailable />
      )}
    </section>
  );
}
