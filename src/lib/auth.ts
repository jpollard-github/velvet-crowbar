import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";
import { getServerEnv } from "@/lib/env";
import { authIpAddressPolicy, authRateLimitPolicy } from "@/lib/auth-policy";

type AuthOptions = {
  allowSignUp?: boolean;
  rateLimit?: ReturnType<typeof authRateLimitPolicy>;
};

export function createAuth(options: AuthOptions = {}) {
  const env = getServerEnv();
  const rateLimit = options.rateLimit ?? authRateLimitPolicy(env.VERCEL_ENV);
  return betterAuth({
    appName: "Velvet Crowbar",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: !options.allowSignUp,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
    },
    rateLimit,
    advanced: {
      useSecureCookies: env.VERCEL_ENV !== "development",
      ipAddress: authIpAddressPolicy(env.VERCEL_ENV),
    },
    trustedOrigins: [env.BETTER_AUTH_URL],
    telemetry: { enabled: false },
    plugins: [nextCookies()],
  });
}

export const auth = createAuth();
