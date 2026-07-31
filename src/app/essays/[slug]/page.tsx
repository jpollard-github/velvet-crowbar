import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { PublicReadUnavailable } from "@/components/public-read-unavailable";
import { readPublicEntry } from "@/db/queries/public";
import { publicMetadata } from "@/features/entries/public-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await readPublicEntry(slug, "essay");
  if (result.availability === "unavailable") {
    return {
      title: "Publication temporarily unavailable",
      robots: { index: false, follow: false },
    };
  }
  const entry = result.data;
  if (!entry) return {};
  const safe = publicMetadata(entry);
  return {
    title: safe.title,
    description: safe.description,
    alternates: { canonical: `/essays/${safe.slug}` },
    openGraph: {
      title: safe.title,
      description: safe.description,
      type: "article",
      publishedTime: safe.publishedAt?.toISOString(),
    },
  };
}

export default async function EssayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await readPublicEntry(slug, "essay");
  if (result.availability === "unavailable") {
    return <PublicReadUnavailable />;
  }
  const entry = result.data;
  if (!entry) notFound();
  return (
    <article className="essay">
      <header className="document-heading">
        <p className="eyebrow">Essay</p>
        <h1>{entry.title}</h1>
        {entry.deck ? <p className="deck">{entry.deck}</p> : null}
      </header>
      <Markdown>{entry.body}</Markdown>
    </article>
  );
}
