import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PRODUCT_NAME, PRODUCTION_URL, TAGLINE } from "@/lib/constants";
import { getPublicEnv, isProductionEnvironment } from "@/lib/env";
import "@/styles/globals.css";

const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${PRODUCT_NAME} — ${TAGLINE}`,
    template: `%s — ${PRODUCT_NAME}`,
  },
  description:
    "Professional sentences with structural consequences: workplace language, software delivery, and the systems beneath them.",
  alternates: {
    canonical: isProductionEnvironment() ? PRODUCTION_URL : siteUrl,
    types: { "application/rss+xml": "/feed.xml" },
  },
  openGraph: {
    title: PRODUCT_NAME,
    description: TAGLINE,
    type: "website",
    siteName: PRODUCT_NAME,
    url: isProductionEnvironment() ? PRODUCTION_URL : siteUrl,
  },
  robots: isProductionEnvironment()
    ? { index: true, follow: true }
    : { index: false, follow: false, noarchive: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
  themeColor: "#2b1826",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div className="page-shell">
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
