# Environments

## Variables

| Variable               | Scope           | Purpose                                                                     |
| ---------------------- | --------------- | --------------------------------------------------------------------------- |
| `DATABASE_URL`         | server          | PostgreSQL connection; no fallback outside local development/build analysis |
| `BETTER_AUTH_SECRET`   | server          | at least 32 random characters, unique per environment                       |
| `BETTER_AUTH_URL`      | server          | exact origin for Better Auth                                                |
| `ADMIN_EMAIL`          | server          | only authorized editor email                                                |
| `NEXT_PUBLIC_SITE_URL` | public          | current environment origin for metadata                                     |
| `VERCEL_ENV`           | supplied        | `development`, `preview`, or `production`                                   |
| `NEXT_PUBLIC_BUILD_ID` | optional public | intentionally non-sensitive build label                                     |

Better Auth 1.6 uses `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`; do not invent
legacy aliases. `.env.example` contains placeholders only.

## Development

Run Next locally and use Docker PostgreSQL or a dedicated development Neon
branch. Keep values in `.env.local`; never use production data. Apply migrations,
bootstrap a development-only editor, then seed. Documented localhost defaults
exist only when no deployment/runtime environment is present.

Local Better Auth rate limiting is disabled and uses its memory store when
focused tests do not explicitly override it. Preview and production enable the
database store and require the generated `rate_limit` migration before auth
traffic.

## Vercel preview

Create a separate preview Neon branch/database. In Vercel Preview scope set all
five required variables, use a preview-only auth secret and preview editor, and
set `NEXT_PUBLIC_SITE_URL`/`BETTER_AUTH_URL` to the approved preview origin.
Dynamic preview URLs may require a stable preview alias or an explicit
environment update; do not infer a host from untrusted headers. Preview emits
`noindex` globally. Never copy the production `DATABASE_URL` into Preview.
Better Auth reads `x-vercel-forwarded-for` in deployed environments because
Vercel supplies and normalizes it. If another proxy is placed in front of
Vercel, revalidate header overwrite and trusted-proxy behavior; client
attribution is not claimed perfect.

## Production

Create a production Neon branch/database and production-only auth secret. Set
`NEXT_PUBLIC_SITE_URL=https://velvetcrowbar.work` and
`BETTER_AUTH_URL=https://velvetcrowbar.work`, plus production `ADMIN_EMAIL`.
Before shifting traffic:

1. run migrations explicitly against the production database from a controlled
   environment;
2. bootstrap the editor separately with a strong password;
3. seed only if Jason approves the sample publication;
4. build and verify public/private behavior;
5. attach the domain and configure DNS outside this repository.

Run `pnpm admin:reset-password` from a controlled operator environment with the
target environment’s variables if credential recovery is required. Interactive
input is masked. A non-interactive container may receive
`ADMIN_RESET_PASSWORD` only as an ephemeral secret; optionally supplied
`ADMIN_RESET_EMAIL` must match `ADMIN_EMAIL`. The command requires exactly one
matching account, uses Better Auth password reset, and invalidates sessions.
There is no email delivery or browser recovery.

The application build analyzes modules with a non-routable placeholder and does
not connect to PostgreSQL. Runtime preview/production parsing fails closed if a
required value is absent.

A Phase 0 technical production deployment, if Jason later authorizes it, is a
quiet infrastructure/workflow validation with safe sample content. The four
seed entries are not a mature publication. Domain attachment does not itself
declare editorial launch; Phase 2 owns deliberate launch and promotion. No
deployment occurs in Phase 0.1.
