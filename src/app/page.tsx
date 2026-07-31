import Link from "next/link";
import { EntryList } from "@/components/entry-list";
import { PublicReadUnavailable } from "@/components/public-read-unavailable";
import { readPublicEntries } from "@/db/queries/public";
import { SUPPORTING_LINE, TAGLINE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const translations = await readPublicEntries("translation", 3);
  return (
    <>
      <section className="hero">
        <p className="folio">Publication № 00 · The calm record</p>
        <h1>{TAGLINE}</h1>
        <p className="hero-support">{SUPPORTING_LINE}</p>
        <p className="hero-copy">
          Velvet Crowbar translates the polite sentences of modern work, then
          examines the machinery beneath them: delivery, architecture,
          incentives, ambiguity, and accountability.
        </p>
        <div className="hero-actions">
          <Link className="button" href="/translations">
            Read the translations
          </Link>
          <Link className="text-link" href="/essays">
            Continue to essays <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
      <section className="section-rule" aria-labelledby="recent-translations">
        <div className="section-heading">
          <p className="eyebrow">From the manual</p>
          <h2 id="recent-translations">Recent translations</h2>
        </div>
        {translations.availability === "available" ? (
          <EntryList
            entries={translations.data}
            emptyMessage="The public file is ready; run the documented seed command to populate it."
          />
        ) : (
          <PublicReadUnavailable />
        )}
      </section>
      <aside className="about-strip">
        <p>
          The incident is not the product. The durable sentence is.{" "}
          <Link href="/about">About the editorial method.</Link>
        </p>
      </aside>
    </>
  );
}
