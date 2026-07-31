"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { publicEntryPath } from "@/features/entries/paths";
import { createEntry, updateEntry } from "@/features/entries/repository";
import { entryInputFromFormData } from "@/features/entries/entry-validation";
import { requireEditor } from "@/lib/authorization";

export type EntryActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  savedRevision?: number;
};

function validationFailure(
  result: Exclude<ReturnType<typeof entryInputFromFormData>, { success: true }>,
): EntryActionState {
  const flattened = result.error.flatten();
  return {
    status: "error",
    message: "Review the marked fields and try again.",
    fieldErrors: flattened.fieldErrors,
  };
}

function refreshPublicPaths(
  previous: { kind: string; slug: string } | null,
  current: { kind: string; slug: string },
) {
  revalidatePath("/");
  revalidatePath("/translations");
  revalidatePath("/essays");
  revalidatePath("/sitemap.xml");
  revalidatePath("/feed.xml");
  for (const candidate of [previous, current]) {
    if (!candidate) continue;
    const path = publicEntryPath(
      candidate.kind as "translation" | "essay",
      candidate.slug,
    );
    if (path) revalidatePath(path);
  }
}

export async function createEntryAction(
  _previousState: EntryActionState,
  formData: FormData,
): Promise<EntryActionState> {
  const session = await requireEditor({ returnTo: "/studio/new" });
  const parsed = entryInputFromFormData(formData);
  if (!parsed.success) return validationFailure(parsed);

  try {
    const entry = await createEntry(parsed.data, session.user.id);
    refreshPublicPaths(null, entry);
    revalidatePath("/studio");
    redirect(`/studio/entries/${entry.id}`);
  } catch (error) {
    if (
      error instanceof Error &&
      "digest" in error &&
      String((error as Error & { digest?: string }).digest).startsWith(
        "NEXT_REDIRECT",
      )
    ) {
      throw error;
    }
    return {
      status: "error",
      message:
        error instanceof Error && error.message.includes("unique")
          ? "That slug is already in use."
          : "The entry could not be saved. Its content was not logged.",
    };
  }
}

export async function updateEntryAction(
  id: string,
  previous: { kind: string; slug: string },
  _previousState: EntryActionState,
  formData: FormData,
): Promise<EntryActionState> {
  const session = await requireEditor({ returnTo: `/studio/entries/${id}` });
  const parsed = entryInputFromFormData(formData);
  if (!parsed.success) return validationFailure(parsed);

  try {
    const entry = await updateEntry(id, parsed.data, session.user.id);
    refreshPublicPaths(previous, entry);
    revalidatePath("/studio");
    revalidatePath(`/studio/entries/${id}`);
    return { status: "idle", savedRevision: entry.version };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error && error.message.includes("unique")
          ? "That slug is already in use."
          : "The entry could not be saved. Its content was not logged.",
    };
  }
}
