import type { Metadata } from "next";
import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { requireEditor } from "@/lib/authorization";
import { environmentLabel } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Editorial studio",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireEditor();
  return (
    <section className="studio-shell">
      <header className="studio-header">
        <div>
          <p className="eyebrow">Private editorial studio</p>
          <h1>Workshop</h1>
        </div>
        <nav aria-label="Studio navigation">
          <Link href="/studio">Entries</Link>
          <Link href="/studio/new">New entry</Link>
          <SignOutButton />
        </nav>
        <div className="environment-badge">
          {environmentLabel()} · {session.user.email}
        </div>
      </header>
      {children}
    </section>
  );
}
