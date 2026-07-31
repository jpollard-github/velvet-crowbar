import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="wordmark" aria-label="Velvet Crowbar home">
        <span aria-hidden="true" className="lever-mark">
          ⟋
        </span>
        Velvet Crowbar
      </Link>
      <nav aria-label="Primary navigation">
        <Link href="/translations">Translations</Link>
        <Link href="/essays">Essays</Link>
        <Link href="/about">About</Link>
      </nav>
    </header>
  );
}
