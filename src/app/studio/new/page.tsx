import { StudioEntryForm } from "@/components/studio-entry-form";
import { createEntryAction } from "@/features/entries/actions";
import { newEntryDefaults } from "@/features/entries/entry-validation";

export default function NewEntryPage() {
  return (
    <>
      <div className="studio-page-heading">
        <p className="eyebrow">New source</p>
        <h2>Begin in private</h2>
      </div>
      <StudioEntryForm entry={newEntryDefaults()} action={createEntryAction} />
    </>
  );
}
