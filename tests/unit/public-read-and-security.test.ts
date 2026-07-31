import { describe, expect, it, vi } from "vitest";
import { capturePublicRead, publicReadDiagnostic } from "@/db/queries/public";
import { authIpAddressPolicy, authRateLimitPolicy } from "@/lib/auth-policy";
import {
  contentSecurityPolicy,
  securityHeadersForEnvironment,
} from "@/lib/security-headers";

describe("public read availability", () => {
  it("distinguishes available empty data from unavailable reads", async () => {
    await expect(
      capturePublicRead(async () => [], {
        operation: "list",
        entryKind: "translation",
      }),
    ).resolves.toEqual({ availability: "available", data: [] });

    const log = vi.fn();
    const result = await capturePublicRead(
      async () => {
        throw new Error("postgresql://secret-host/private body");
      },
      { operation: "detail", entryKind: "essay" },
      log,
    );
    expect(result).toEqual({
      availability: "unavailable",
      reason: "current_read_unavailable",
    });
    expect(log).toHaveBeenCalledOnce();
    expect(JSON.stringify(log.mock.calls)).not.toContain("secret-host");
    expect(JSON.stringify(log.mock.calls)).not.toContain("private body");
  });

  it("emits only constrained diagnostic metadata", () => {
    const diagnostic = publicReadDiagnostic(
      "detail",
      "translation",
      Object.assign(new Error("sensitive"), { name: "Bad name with spaces" }),
    );
    expect(diagnostic.errorName).toBe("UnknownError");
    expect(Object.keys(diagnostic).sort()).toEqual([
      "entryKind",
      "environment",
      "errorName",
      "event",
      "operation",
    ]);
  });
});

describe("auth and response security policy", () => {
  it("uses durable rate limiting in preview and production", () => {
    expect(authRateLimitPolicy("development").storage).toBe("memory");
    for (const environment of ["preview", "production"] as const) {
      expect(authRateLimitPolicy(environment)).toMatchObject({
        enabled: true,
        storage: "database",
      });
      expect(authIpAddressPolicy(environment)).toEqual({
        ipAddressHeaders: ["x-vercel-forwarded-for"],
      });
    }
  });

  it("uses a bounded production CSP and development-only allowances", () => {
    const production = contentSecurityPolicy("production");
    expect(production).toContain("frame-ancestors 'none'");
    expect(production).toContain("frame-src 'none'");
    expect(production).toContain("object-src 'none'");
    expect(production).toContain("upgrade-insecure-requests");
    expect(production).not.toContain("'unsafe-eval'");
    expect(production).not.toContain("https:");
    expect(contentSecurityPolicy("development")).toContain("'unsafe-eval'");
    expect(contentSecurityPolicy("development")).toContain("ws:");
  });

  it("sets HSTS only on production while retaining core headers everywhere", () => {
    const production = new Map(
      securityHeadersForEnvironment("production").map(({ key, value }) => [
        key,
        value,
      ]),
    );
    expect(production.get("Strict-Transport-Security")).toContain(
      "max-age=63072000",
    );
    expect(production.get("X-Content-Type-Options")).toBe("nosniff");
    expect(production.get("X-Frame-Options")).toBe("DENY");
    expect(production.get("Permissions-Policy")).toContain("camera=()");
    expect(
      securityHeadersForEnvironment("preview").some(
        ({ key }) => key === "Strict-Transport-Security",
      ),
    ).toBe(false);
    expect(
      securityHeadersForEnvironment("development").some(
        ({ key }) => key === "Strict-Transport-Security",
      ),
    ).toBe(false);
  });
});
