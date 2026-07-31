import { readFile } from "node:fs/promises";
import { eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDb, getDb } from "@/db/client";
import { rateLimit, session, user } from "@/db/schema";
import { createAuth } from "@/lib/auth";
import { isConfiguredEditor } from "@/lib/editor-identity";
import { parseServerEnv } from "@/lib/env";
import { resetSingleEditorPassword } from "../../scripts/lib/admin-reset-password";

const originalPassword = "synthetic-password-only";
const resetPassword = "synthetic-reset-password-only";

function signInRequest(password: string, ip = "203.0.113.40") {
  return new Request("http://localhost:3000/api/auth/sign-in/email", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify({
      email: "editor@example.test",
      password,
    }),
  });
}

describe("single-editor authentication boundary", () => {
  const runtimeAuth = createAuth();

  beforeAll(async () => {
    await migrate(getDb(), { migrationsFolder: "drizzle" });
    await getDb().execute(
      sql`TRUNCATE TABLE entry_revisions, entries, rate_limit, session, account, verification, "user" CASCADE`,
    );
  });

  afterAll(async () => {
    await closeDb();
  });

  it("disables public email/password sign-up", async () => {
    const response = await runtimeAuth.handler(
      new Request("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          name: "Synthetic Visitor",
          email: "visitor@example.test",
          password: "synthetic-password-only",
        }),
      }),
    );
    expect(response.ok).toBe(false);
    expect(await getDb().select().from(user)).toHaveLength(0);
  });

  it("accepts the bootstrapped configured editor and rejects a wrong email", async () => {
    const bootstrapAuth = createAuth({ allowSignUp: true });
    await bootstrapAuth.api.signUpEmail({
      body: {
        name: "Synthetic Editor",
        email: "editor@example.test",
        password: originalPassword,
      },
    });
    const accepted = await runtimeAuth.api.signInEmail({
      body: {
        email: "editor@example.test",
        password: originalPassword,
      },
    });
    expect(isConfiguredEditor(accepted.user.email, "editor@example.test")).toBe(
      true,
    );
    await expect(
      runtimeAuth.api.signInEmail({
        body: {
          email: "wrong@example.test",
          password: originalPassword,
        },
      }),
    ).rejects.toThrow();
  });

  it("resets only the configured single editor through Better Auth and invalidates sessions", async () => {
    expect(await getDb().select().from(session)).not.toHaveLength(0);
    await expect(
      resetSingleEditorPassword({
        db: getDb(),
        environment: parseServerEnv(process.env),
        targetEmail: "other@example.test",
        newPassword: resetPassword,
      }),
    ).rejects.toThrow("must match ADMIN_EMAIL");

    await resetSingleEditorPassword({
      db: getDb(),
      environment: parseServerEnv(process.env),
      targetEmail: "editor@example.test",
      newPassword: resetPassword,
    });
    expect(await getDb().select().from(session)).toHaveLength(0);
    await expect(
      runtimeAuth.api.signInEmail({
        body: {
          email: "editor@example.test",
          password: originalPassword,
        },
      }),
    ).rejects.toThrow();
    await expect(
      runtimeAuth.api.signInEmail({
        body: {
          email: "editor@example.test",
          password: resetPassword,
        },
      }),
    ).resolves.toMatchObject({ user: { email: "editor@example.test" } });
  });

  it("fails closed when the editor database is ambiguous", async () => {
    await getDb().insert(user).values({
      id: "00000000-0000-4000-8000-000000000099",
      name: "Synthetic second editor",
      email: "second@example.test",
      emailVerified: true,
    });
    await expect(
      resetSingleEditorPassword({
        db: getDb(),
        environment: parseServerEnv(process.env),
        targetEmail: "editor@example.test",
        newPassword: "another-synthetic-password",
      }),
    ).rejects.toThrow("exactly one editor account");
    await getDb().delete(user).where(eq(user.email, "second@example.test"));
  });

  it("persists safe rate-limit state across auth instances and expires deterministically", async () => {
    await getDb().delete(rateLimit);
    const policy = {
      enabled: true,
      storage: "database" as const,
      window: 1,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 1, max: 2 },
      },
    };
    const firstInstance = createAuth({ rateLimit: policy });
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await firstInstance.handler(
        signInRequest("wrong-synthetic-password"),
      );
      expect(response.status).not.toBe(429);
    }

    const secondInstance = createAuth({ rateLimit: policy });
    const limited = await secondInstance.handler(signInRequest(resetPassword));
    expect(limited.status).toBe(429);
    const payload = await limited.text();
    expect(payload).toBe(
      JSON.stringify({
        message: "Too many requests. Please try again later.",
      }),
    );

    const rows = await getDb().select().from(rateLimit);
    expect(rows).toHaveLength(1);
    const serialized = JSON.stringify(rows);
    expect(serialized).not.toContain("editor@example.test");
    expect(serialized).not.toContain(resetPassword);
    expect(serialized).not.toContain("wrong-synthetic-password");

    await getDb()
      .update(rateLimit)
      .set({ lastRequest: Date.now() - 2_000 });
    const recovered = await createAuth({ rateLimit: policy }).handler(
      signInRequest(resetPassword),
    );
    expect(recovered.status).toBe(200);
  });

  it("requires server authorization in every entry mutation action", async () => {
    const source = await readFile(
      new URL("../../src/features/entries/actions.ts", import.meta.url),
      "utf8",
    );
    const actionBodies = source.split("export async function ").slice(1);
    expect(actionBodies.length).toBeGreaterThanOrEqual(2);
    for (const body of actionBodies) expect(body).toContain("requireEditor");
  });

  it("fails closed when the configured editor is missing", async () => {
    await getDb().delete(user);
    await expect(
      resetSingleEditorPassword({
        db: getDb(),
        environment: parseServerEnv(process.env),
        targetEmail: "editor@example.test",
        newPassword: "missing-editor-password",
      }),
    ).rejects.toThrow("exactly one editor account");
  });
});
