import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "The purpose, editorial method, and authorship of Velvet Crowbar.",
};

export default function AboutPage() {
  return (
    <article className="essay about">
      <header className="document-heading">
        <p className="eyebrow">Editorial note</p>
        <h1>About Velvet Crowbar</h1>
        <p className="deck">
          A publication about the language difficult systems teach people to
          use.
        </p>
      </header>
      <div className="prose">
        <p>
          Velvet Crowbar examines workplace language, software delivery,
          architecture, management systems, incentives, ambiguity, evidence, and
          the absurd machinery of modern work. The goal is not to preserve a
          grievance. It is to find the sentence or principle that travels.
        </p>
        <h2>Authorship and assistance</h2>
        <p>
          Jason Pollard is the author, editor, publisher, and final editorial
          authority. Pieces are written and edited by Jason Pollard, with
          AI-assisted drafting and editorial pressure-testing. AI does not
          witness events, verify workplace accounts, or decide what is
          published.
        </p>
        <h2>Generalization is the method</h2>
        <p>
          Public observations may be generalized, compressed, or composite. They
          do not identify current coworkers, employers, or clients. Renaming a
          person is not enough; identifying structures and distinctive details
          must also be removed.
        </p>
        <p>
          Satire names a pattern. Analysis proposes a mechanism. Neither should
          be mistaken for factual reporting about an identifiable organization
          or person.
        </p>
        <h2>The private workshop</h2>
        <p>
          Source notes and workplace autopsies begin private. The editorial
          studio does not publish them automatically. Publication is a separate,
          deliberate act with a human review acknowledgment—and that checklist
          is a control, not a guarantee of anonymity, legal safety, or factual
          correctness.
        </p>
      </div>
    </article>
  );
}
