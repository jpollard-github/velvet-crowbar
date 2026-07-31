import { describe, expect, it } from "vitest";
import {
  isProductionEnvironment,
  parsePublicEnv,
  parseServerEnv,
} from "@/lib/env";

describe("environment validation", () => {
  it("uses localhost-only defaults for an explicit development environment", () => {
    const parsed = parseServerEnv({
      NODE_ENV: "development",
      VERCEL_ENV: "development",
    });
    expect(parsed.DATABASE_URL).toContain("localhost:54329");
    expect(parsed.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
  });

  it("fails closed in preview without independent values", () => {
    expect(() =>
      parseServerEnv({ NODE_ENV: "production", VERCEL_ENV: "preview" }),
    ).toThrow();
  });

  it("fails closed in production when the public site URL is absent", () => {
    expect(() =>
      parsePublicEnv({ NODE_ENV: "production", VERCEL_ENV: "production" }),
    ).toThrow();
    expect(
      isProductionEnvironment({
        NODE_ENV: "production",
        VERCEL_ENV: "production",
      }),
    ).toBe(true);
  });

  it("allows build analysis without a reachable database", () => {
    const parsed = parseServerEnv({
      NODE_ENV: "production",
      NEXT_PHASE: "phase-production-build",
    });
    expect(parsed.DATABASE_URL).toContain("127.0.0.1:1");
  });
});
