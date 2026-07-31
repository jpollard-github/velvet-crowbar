export type DeploymentEnvironment = "development" | "preview" | "production";

export function authRateLimitPolicy(environment: DeploymentEnvironment) {
  const durable = environment === "preview" || environment === "production";
  return {
    enabled: durable,
    storage: durable ? ("database" as const) : ("memory" as const),
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
    },
  };
}

/**
 * Vercel overwrites x-forwarded-for and provides x-vercel-forwarded-for.
 * The platform-specific header is preferred for deployed client identity;
 * local development uses Better Auth's loopback fallback.
 */
export function authIpAddressPolicy(environment: DeploymentEnvironment) {
  return environment === "development"
    ? undefined
    : { ipAddressHeaders: ["x-vercel-forwarded-for"] };
}
