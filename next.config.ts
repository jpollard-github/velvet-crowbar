import type { NextConfig } from "next";
import type { DeploymentEnvironment } from "./src/lib/auth-policy";
import { securityHeadersForEnvironment } from "./src/lib/security-headers";

function deploymentEnvironment(): DeploymentEnvironment {
  const candidate = process.env.VERCEL_ENV;
  return candidate === "preview" || candidate === "production"
    ? candidate
    : "development";
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["postgres"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeadersForEnvironment(deploymentEnvironment()),
      },
    ];
  },
};

export default nextConfig;
