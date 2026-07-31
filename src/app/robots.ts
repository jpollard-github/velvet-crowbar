import type { MetadataRoute } from "next";
import { PRODUCTION_URL } from "@/lib/constants";
import { isProductionEnvironment } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  if (!isProductionEnvironment()) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/studio", "/sign-in", "/api/"],
      },
    ],
    sitemap: `${PRODUCTION_URL}/sitemap.xml`,
    host: PRODUCTION_URL,
  };
}
