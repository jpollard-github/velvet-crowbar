import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isConfiguredEditor } from "@/lib/editor-identity";
import { getServerEnv } from "@/lib/env";

export type EditorSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export async function getEditorSession(): Promise<EditorSession | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return isConfiguredEditor(session.user.email, getServerEnv().ADMIN_EMAIL)
    ? session
    : null;
}

export async function requireEditor(options?: {
  returnTo?: string;
}): Promise<EditorSession> {
  const session = await getEditorSession();
  if (!session) {
    const returnTo = encodeURIComponent(options?.returnTo ?? "/studio");
    redirect(`/sign-in?returnTo=${returnTo}`);
  }
  return session;
}
