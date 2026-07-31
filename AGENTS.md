# Velvet Crowbar agent guide

## Product

Velvet Crowbar is a public editorial publication with a private workshop behind
it. Its voice is calm, exact, dryly funny, and more interested in durable
systems than personal grievance. The primary line is “Calm language for
difficult systems.” Jason Pollard is author, editor, publisher, and final
editorial authority. Identifiable current-employer, coworker, client, or
distinctive incident material is private by default and must not enter public
surfaces or Git.

## Read before changing

Inspect the current code and Git state before editing. Route questions through:

- architecture and ownership: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- editorial safety: [docs/EDITORIAL-MODEL.md](docs/EDITORIAL-MODEL.md)
- visual system: [docs/DESIGN-BRIEF.md](docs/DESIGN-BRIEF.md)
- environment setup: [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md)
- threats and controls: [docs/SECURITY-AND-PRIVACY.md](docs/SECURITY-AND-PRIVACY.md)
- modification steps: [docs/CHANGE-RECIPES.md](docs/CHANGE-RECIPES.md)
- planned work: [docs/ROADMAP.md](docs/ROADMAP.md)

## Stack

One Next.js App Router app; strict TypeScript; Node 24; exact pnpm 10;
PostgreSQL through Postgres.js and Drizzle; Better Auth email/password; Zod at
input boundaries; one safe React Markdown renderer; Vitest and Playwright;
custom CSS; Vercel target. Zod is the sole validation library because Phase 0
needs application, environment, and form validation rather than portable JSON
Schema.

## Architecture laws

- Server Components are default; use Client Components only for interaction.
- Page files compose feature modules. Database and auth modules are server-only.
- Drizzle schema and generated SQL migrations are authoritative.
- Validate application input at the boundary with Zod.
- Every anonymous content query proves `visibility = 'public'` in SQL.
- Never fetch private content and hide it with CSS or client code.
- Public rendering and studio preview share `src/components/markdown.tsx`.
- Add no generic repository abstraction until repeated behavior earns it.
- Do not create root-file dumping grounds or monolithic route implementations.
- Every route handler and Server Action needs authorization where applicable and
  validation. Do not log content bodies.
- Draft/private content must not become cacheable, enumerable, or included in
  metadata.
- Only kinds with a public route (`translation`, `essay`) may become public.
- Treat a failed public database read as unavailable, never as empty or missing.

## Editorial safety laws

- New entries default to `private`; publication is explicit. `unlisted` does not
  exist and is not a privacy boundary.
- Private/draft translations may be incomplete. Public translations require all
  four structured fields and a fresh review acknowledgment on every public save.
- Public edits preserve `publishedAt`; withdrawal retains it historically;
  deliberate republication assigns a new value.
- Public seed content contains no current employer, coworker, client, internal
  URL, exact identifying count, proprietary name, or distinctive incident.
- Sanitization means generalization, not name substitution.
- Private content never enters Git, fixtures, seeds, generated metadata, RSS,
  sitemap, search, analytics, logs, or source review archives.
- Publication requires human review acknowledgment. It is not an anonymity,
  legal-safety, or correctness guarantee.
- No AI system receives private content unless a later explicitly reviewed,
  opt-in workflow adds that capability.

## Authentication

There is one editor using Better Auth email/password. The running app has no
public registration and additionally matches the session email to `ADMIN_EMAIL`.
Secrets never enter source. Studio pages and mutations authorize server-side;
client redirects are navigation only. Create the first account only through the
explicit bootstrap command.
Password recovery is the explicit operator-only
`pnpm admin:reset-password` command. It must target the configured single editor
and revoke sessions; there is no public or email recovery flow.

## Environments

Development, Vercel preview, and Vercel production use separate database URLs,
auth secrets, site URLs, and bootstrapped accounts. Preview must never use the
production database. All non-production output is noindexed. A build uses
non-routable build placeholders and does not open a database connection.

## Commands

- `pnpm dev`, `pnpm format`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`
- `pnpm test:unit`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm build`
- `pnpm db:up`, `pnpm db:down`, `pnpm db:generate`, `pnpm db:migrate`,
  `pnpm db:studio`, `pnpm db:seed`, `pnpm admin:bootstrap`
- `pnpm admin:reset-password`
- `pnpm audit:docs`, `pnpm audit:structure`, `pnpm audit:unused`,
  `pnpm audit:deps`, `pnpm verify:full`
- `pnpm repo:export:dry-run`, `pnpm repo:export`

## Testing

Add focused tests at changed boundaries. UI work requires real browser checks at
desktop and 390px, no horizontal overflow, keyboard/focus and reduced-motion
checks. Preserve public/private isolation coverage. Never claim an unrun check
passed.

## Git, archive, and review discipline

Preserve user work. Do not reset, rebase, commit, push, add a remote, or deploy
unless explicitly requested. Inspect branch, base commit, remotes, and dirty
state. Run export dry-run and final verification before an archive. Do not edit
after archiving; recreate it after any relevant edit.

During review, require visible public SQL predicates and server authorization
for every studio mutation. Reject private content in logs or public artifacts,
raw HTML execution in Markdown, draft/private route enumeration or caching, and
any preview-to-production database fallback.
