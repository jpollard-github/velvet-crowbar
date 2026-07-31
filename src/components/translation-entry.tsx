import type { PublicEntry } from "@/db/queries/public";
import { Markdown } from "./markdown";

type TranslationShape = Pick<
  PublicEntry,
  | "title"
  | "deck"
  | "politeSentence"
  | "translation"
  | "systemUnderneath"
  | "usefulPrinciple"
  | "body"
>;

export function TranslationEntry({ entry }: { entry: TranslationShape }) {
  return (
    <article className="translation-document">
      <header className="document-heading">
        <p className="eyebrow">Velvet Crowbar translation</p>
        <h1>{entry.title}</h1>
        {entry.deck ? <p className="deck">{entry.deck}</p> : null}
      </header>
      <dl className="translation-sections">
        <div>
          <dt>The polite sentence</dt>
          <dd>“{entry.politeSentence}”</dd>
        </div>
        <div className="translation-answer">
          <dt>Translation</dt>
          <dd>“{entry.translation}”</dd>
        </div>
        <div>
          <dt>What is happening</dt>
          <dd>{entry.systemUnderneath}</dd>
        </div>
        <div className="principle">
          <dt>The principle</dt>
          <dd>{entry.usefulPrinciple}</dd>
        </div>
      </dl>
      {entry.body ? <Markdown>{entry.body}</Markdown> : null}
    </article>
  );
}
