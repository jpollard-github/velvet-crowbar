import { environmentLabel } from "@/lib/env";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      service: "velvet-crowbar",
      status: "ok",
      environment: environmentLabel(),
      version: process.env.NEXT_PUBLIC_BUILD_ID ?? "local",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
