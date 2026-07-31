import { z } from "zod";

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_BUILD_ID: z.string().trim().min(1).optional(),
});

export const serverEnvSchema = publicEnvSchema.extend({
  DATABASE_URL: z.string().trim().startsWith("postgresql://"),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  ADMIN_EMAIL: z.email().transform((value) => value.toLowerCase()),
  VERCEL_ENV: z
    .enum(["development", "preview", "production"])
    .default("development"),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

const developmentDefaults = {
  DATABASE_URL:
    "postgresql://velvet_crowbar:velvet_crowbar@localhost:54329/velvet_crowbar",
  BETTER_AUTH_SECRET: "development-only-secret-change-before-any-deployment",
  BETTER_AUTH_URL: "http://localhost:3000",
  ADMIN_EMAIL: "editor@example.test",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  VERCEL_ENV: "development" as const,
};

const buildDefaults = {
  ...developmentDefaults,
  DATABASE_URL: "postgresql://build:build@127.0.0.1:1/build_not_connected",
  BETTER_AUTH_SECRET: "build-only-secret-never-used-by-a-running-application",
};

function isBuildPhase(input: NodeJS.ProcessEnv): boolean {
  return input.NEXT_PHASE === "phase-production-build";
}

export function parseServerEnv(input: NodeJS.ProcessEnv): ServerEnv {
  const vercelEnvironment = input.VERCEL_ENV;
  const canUseLocalDefaults =
    isBuildPhase(input) ||
    (!input.NODE_ENV && !vercelEnvironment) ||
    input.NODE_ENV === "development" ||
    input.NODE_ENV === "test" ||
    vercelEnvironment === "development";

  const source = canUseLocalDefaults
    ? {
        ...(isBuildPhase(input) ? buildDefaults : developmentDefaults),
        ...input,
      }
    : input;

  return serverEnvSchema.parse(source);
}

export function parsePublicEnv(input: NodeJS.ProcessEnv): PublicEnv {
  const fallback =
    input.VERCEL_ENV === "production"
      ? undefined
      : { NEXT_PUBLIC_SITE_URL: "http://localhost:3000" };
  return publicEnvSchema.parse({ ...fallback, ...input });
}

export function getServerEnv(): ServerEnv {
  return parseServerEnv(process.env);
}

export function getPublicEnv(): PublicEnv {
  return parsePublicEnv(process.env);
}

export function isProductionEnvironment(
  input: NodeJS.ProcessEnv = process.env,
): boolean {
  return input.VERCEL_ENV === "production";
}

export function environmentLabel(input: NodeJS.ProcessEnv = process.env) {
  return input.VERCEL_ENV ?? "development";
}
