import { count } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "../src/db/schema";
import { user } from "../src/db/schema";
import { openScriptDatabase } from "./lib/database";
import { readMaskedSecret } from "./lib/masked-secret";

const { db, client, environment } = openScriptDatabase();

try {
  const countRows = await db.select({ value: count() }).from(user);
  const editorCount = countRows[0]?.value ?? 0;
  if (editorCount > 0) {
    throw new Error(
      "An editor account already exists. This command will not create a second account; use Better Auth’s documented password recovery flow for recovery.",
    );
  }

  const email = (process.env.ADMIN_BOOTSTRAP_EMAIL ?? environment.ADMIN_EMAIL)
    .trim()
    .toLowerCase();
  if (email !== environment.ADMIN_EMAIL) {
    throw new Error("Bootstrap email must match ADMIN_EMAIL.");
  }
  const password = await readMaskedSecret({
    environmentVariable: "ADMIN_BOOTSTRAP_PASSWORD",
    prompt: "Password",
  });
  if (password.length < 12 || password.length > 128) {
    throw new Error("Password must contain between 12 and 128 characters.");
  }

  const bootstrapAuth = betterAuth({
    appName: "Velvet Crowbar",
    baseURL: environment.BETTER_AUTH_URL,
    secret: environment.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },
    telemetry: { enabled: false },
  });
  await bootstrapAuth.api.signUpEmail({
    body: { email, password, name: "Jason Pollard" },
  });
  console.log(`Created the single editor account for ${email}.`);
  console.log("The password was not printed or written to source.");
} finally {
  await client.end();
}
