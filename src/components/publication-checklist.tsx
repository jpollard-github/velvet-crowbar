export const publicationChecks = [
  "Names and employer or client identity",
  "Internal URLs and proprietary system names",
  "Precise role combinations and unusual technical incidents",
  "Exact identifying counts",
  "Direct competence or mental-health judgments",
  "Unsupported motive claims",
  "Proprietary implementation details",
] as const;

export function PublicationChecklist({
  checked,
  onChange,
  error,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string[];
}) {
  return (
    <fieldset className="publication-checklist">
      <legend>Publication review</legend>
      <p>
        Before publishing, remove or generalize the following. This review does
        not guarantee anonymity, legal safety, or factual correctness.
      </p>
      <ul>
        {publicationChecks.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <label className="check-row">
        <input
          type="checkbox"
          name="publicationReviewed"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        I completed this human review and choose to publish.
      </label>
      {error?.map((message) => (
        <p className="field-error" key={message}>
          {message}
        </p>
      ))}
    </fieldset>
  );
}
