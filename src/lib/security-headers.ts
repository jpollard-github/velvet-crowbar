import type { DeploymentEnvironment } from "./auth-policy";

export type SecurityHeader = { key: string; value: string };

export function contentSecurityPolicy(
  environment: DeploymentEnvironment,
): string {
  const development = environment === "development";
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    `script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${development ? " ws: wss:" : ""}`,
    "manifest-src 'self'",
    "media-src 'none'",
    "worker-src 'self' blob:",
    ...(development ? [] : ["upgrade-insecure-requests"]),
  ];
  return directives.join("; ");
}

/**
 * Static policy for every Next response. The CSP permits the framework's
 * inline bootstrap/style behavior, but has no wildcard hosts or external data
 * services. HSTS is production-only because previews are not the canonical
 * domain and local development is HTTP.
 */
export function securityHeadersForEnvironment(
  environment: DeploymentEnvironment,
): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    {
      key: "Content-Security-Policy",
      value: contentSecurityPolicy(environment),
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value:
        "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  ];
  if (environment === "production") {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }
  return headers;
}
