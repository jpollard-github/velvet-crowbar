import { eq } from "drizzle-orm";
import { entries, entryRevisions, user } from "../src/db/schema";
import { openScriptDatabase } from "./lib/database";

const seedEntries = [
  {
    slug: "on-being-blocked",
    kind: "translation" as const,
    title: "On being blocked",
    deck: "A dependency should not become invisible when it changes hands.",
    politeSentence:
      "I’m ready to proceed as soon as the required review is completed.",
    translation: "The delay has a name, and it is not mine.",
    systemUnderneath:
      "A dependency without an accountable owner has been transferred to the person waiting on it.",
    usefulPrinciple: "Delays should remain visible at their source.",
    body: "",
    tags: ["accountability", "delivery"],
  },
  {
    slug: "on-repeated-indecision",
    kind: "translation" as const,
    title: "On repeated indecision",
    deck: "Ambiguity is not an implementation strategy.",
    politeSentence:
      "I can work with either direction. I just need a decision so I can execute consistently.",
    translation: "Please stop making ambiguity my deliverable.",
    systemUnderneath:
      "Unresolved decisions are often transferred to implementers and later judged as execution failures.",
    usefulPrinciple:
      "Decision authority and delivery accountability should be aligned.",
    body: "",
    tags: ["decisions", "accountability"],
  },
  {
    slug: "on-bad-process",
    kind: "translation" as const,
    title: "On bad process",
    deck: "Visible activity is not the same thing as useful control.",
    politeSentence:
      "The current process appears to be producing delays without reducing risk.",
    translation: "This machine consumes time and manufactures fog.",
    systemUnderneath:
      "A process may remain visibly active while failing to improve quality, speed, ownership, or understanding.",
    usefulPrinciple:
      "Process should be evaluated by the risk it removes and the outcome it enables.",
    body: "",
    tags: ["process", "risk"],
  },
  {
    slug: "a-diagram-won",
    kind: "essay" as const,
    title: "A Diagram Won",
    deck: "A boundary drawn in a repository map is a claim about independent change—not proof of it.",
    politeSentence: null,
    translation: null,
    systemUnderneath: null,
    usefulPrinciple: null,
    body: `A system can be split into cleaner boxes without becoming more modular.

The diagram improves first. Each shape acquires a name, an owner, and a repository. The arrows remain, but arrows are visually polite. They do not show the meetings, synchronized releases, or sequence of changes required to keep the boxes in agreement.

## A boundary is a coordination claim

A repository boundary creates a coordination boundary. That can be valuable when the enclosed software can change, test, and release independently. When it cannot, the boundary may merely move coupling from code into calendars.

The question is not whether the diagram has smaller shapes. The question is whether a useful change can cross fewer human and technical gates.

## Measure the behavior

Modularity is visible in independent change:

- one part can evolve without a synchronized edit elsewhere;
- tests explain the contract at the boundary;
- releases do not require an improvised sequence;
- ownership reduces ambiguity instead of multiplying handoffs.

Splitting coupled software can still be the right move. It may expose an interface that needs to become real. But the split is the beginning of that work, not evidence that it is finished.

The diagram may win the meeting. The runtime still keeps the score.`,
    tags: ["architecture", "delivery"],
  },
] as const;

const { db, client, environment } = openScriptDatabase();

try {
  const [editor] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, environment.ADMIN_EMAIL))
    .limit(1);
  if (!editor) {
    throw new Error(
      "Bootstrap the configured editor before seeding reviewed public entries.",
    );
  }

  await db.transaction(async (transaction) => {
    for (const seed of seedEntries) {
      const now = new Date();
      const [created] = await transaction
        .insert(entries)
        .values({
          ...seed,
          tags: [...seed.tags],
          visibility: "public",
          publicationReviewedAt: now,
          publicationReviewedBy: editor.id,
          publishedAt: now,
        })
        .onConflictDoNothing({ target: entries.slug })
        .returning();
      if (!created) continue;
      await transaction.insert(entryRevisions).values({
        entryId: created.id,
        revisionNumber: 1,
        visibility: "public",
        snapshot: {
          title: seed.title,
          slug: seed.slug,
          kind: seed.kind,
          deck: seed.deck,
          politeSentence: seed.politeSentence,
          translation: seed.translation,
          systemUnderneath: seed.systemUnderneath,
          usefulPrinciple: seed.usefulPrinciple,
          body: seed.body,
          tags: [...seed.tags],
          sourceEntryId: null,
        },
      });
    }
  });
  console.log("Public-safe seed entries are present.");
} finally {
  await client.end();
}
