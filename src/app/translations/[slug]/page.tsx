import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicReadUnavailable } from "@/components/public-read-unavailable";
import { TranslationEntry } from "@/components/translation-entry";
import { readPublicEntry } from "@/db/queries/public";
import { publicMetadata } from "@/features/entries/public-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await readPublicEntry(slug, "translation");
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
    alternates: { canonical: `/translations/${safe.slug}` },
    openGraph: {
      title: safe.title,
      description: safe.description,
      type: "article",
      publishedTime: safe.publishedAt?.toISOString(),
    },
  };
}

export default async function TranslationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await readPublicEntry(slug, "translation");
  if (result.availability === "unavailable") {
    return <PublicReadUnavailable />;
  }
  const entry = result.data;
  if (!entry) notFound();
  return <TranslationEntry entry={entry} />;
}
