import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "../../src/db/schema";
import { user } from "../../src/db/schema";
import type { ServerEnv } from "../../src/lib/env";

export async function resetSingleEditorPassword({
  db,
  environment,
  targetEmail,
  newPassword,
}: {
  db: PostgresJsDatabase<typeof schema>;
  environment: ServerEnv;
  targetEmail: string;
  newPassword: string;
}) {
  const configuredEmail = environment.ADMIN_EMAIL.trim().toLowerCase();
  const normalizedTarget = targetEmail.trim().toLowerCase();
  if (normalizedTarget !== configuredEmail) {
    throw new Error("Reset email must match ADMIN_EMAIL.");
  }
  if (newPassword.length < 12 || newPassword.length > 128) {
    throw new Error("Password must contain between 12 and 128 characters.");
  }

  const editors = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .limit(2);
  if (editors.length !== 1) {
    throw new Error(
      "Password reset requires exactly one editor account in the database.",
    );
  }
  if (editors[0]?.email.trim().toLowerCase() !== configuredEmail) {
    throw new Error("The only editor account does not match ADMIN_EMAIL.");
  }

  let resetToken: string | null = null;
  const operatorAuth = betterAuth({
    appName: "Velvet Crowbar",
    baseURL: environment.BETTER_AUTH_URL,
    secret: environment.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ token, user: resetUser }) => {
        if (resetUser.email.trim().toLowerCase() !== configuredEmail) {
          throw new Error("Better Auth selected an unexpected account.");
        }
        resetToken = token;
      },
    },
    rateLimit: { enabled: false },
    telemetry: { enabled: false },
  });

  await operatorAuth.api.requestPasswordReset({
    body: { email: configuredEmail },
  });
  if (!resetToken) {
    throw new Error("Better Auth did not issue an operator reset token.");
  }
  await operatorAuth.api.resetPassword({
    body: { newPassword, token: resetToken },
  });

  return { editorId: editors[0].id, email: configuredEmail };
}
