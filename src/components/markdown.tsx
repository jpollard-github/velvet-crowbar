import type { ComponentPropsWithoutRef, ReactNode } from "react";
import ReactMarkdown, { type UrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";

function childText(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) return children.map(childText).join("");
  return "";
}

export function headingId(children: ReactNode) {
  return childText(children)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export const safeUrlTransform: UrlTransform = (url) => {
  const normalized = url.trim().toLowerCase();
  if (
    normalized.startsWith("/") ||
    normalized.startsWith("#") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("http://") ||
    normalized.startsWith("mailto:")
  ) {
    return url;
  }
  return "";
};

function SafeLink({
  href = "",
  children,
  ...props
}: ComponentPropsWithoutRef<"a">) {
  const external = /^https?:\/\//i.test(href);
  return (
    <a
      href={href}
      {...props}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer external" }
        : {})}
    >
      {children}
      {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
    </a>
  );
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={safeUrlTransform}
        components={{
          a: SafeLink,
          img: () => null,
          h1: ({ children: heading }) => (
            <h2 id={headingId(heading)}>{heading}</h2>
          ),
          h2: ({ children: heading }) => (
            <h2 id={headingId(heading)}>{heading}</h2>
          ),
          h3: ({ children: heading }) => (
            <h3 id={headingId(heading)}>{heading}</h3>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
