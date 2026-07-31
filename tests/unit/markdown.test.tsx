import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Markdown } from "@/components/markdown";
import { TranslationEntry } from "@/components/translation-entry";

describe("canonical Markdown renderer", () => {
  it("does not execute or emit raw HTML payloads", () => {
    const html = renderToStaticMarkup(
      <Markdown>{`Safe\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(2)>\n\n<iframe src="https://example.test"></iframe>`}</Markdown>,
    );
    expect(html).toContain("Safe");
    expect(html).not.toMatch(/script|iframe|onerror|<img/i);
  });

  it("rejects unsafe schemes and suppresses remote images", () => {
    const html = renderToStaticMarkup(
      <Markdown>{`[bad](javascript:alert(1)) [data](data:text/html,bad) ![remote](https://example.test/x.png)`}</Markdown>,
    );
    expect(html).not.toMatch(/javascript:|data:|<img/i);
  });

  it("adds safe external-link behavior and accessible headings", () => {
    const html = renderToStaticMarkup(
      <Markdown>{`# Stable heading\n\n[Reference](https://example.test)`}</Markdown>,
    );
    expect(html).toContain('id="stable-heading"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer external"');
  });

  it("renders the translation document structure", () => {
    const html = renderToStaticMarkup(
      <TranslationEntry
        entry={{
          title: "Synthetic translation",
          deck: null,
          politeSentence: "A calm sentence.",
          translation: "A structural consequence.",
          systemUnderneath: "A generalized system.",
          usefulPrinciple: "Keep ownership visible.",
          body: "",
        }}
      />,
    );
    expect(html).toContain("<article");
    expect(html).toContain("The polite sentence");
    expect(html).toContain("Translation");
    expect(html).toContain("What is happening");
    expect(html).toContain("The principle");
  });
});
