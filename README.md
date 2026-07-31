# Velvet Crowbar

> Calm language for difficult systems.  
> Professional sentences with structural consequences.

Velvet Crowbar is a public editorial publication and a private editorial studio
about workplace language, software delivery, architecture, management systems,
organizational incentives, ambiguity, accountability, evidence, process
theater, AI-driven development, and the machinery of modern work. Jason Pollard
is the author and final editorial authority.

Phase 0.1 is a conventional single Next.js application: public reading routes,
one protected editor, typed PostgreSQL content and revisions, deliberate
publication review, and a safe source-review export.

## Baseline and status

Before implementation the directory contained only the retained local task
prompt `codex-prompt-velvet-crowbar-phase-0-pnpm10.md`; it was not a Git
repository. Retained task briefs now live under `codex-prompts/`; they remain
ignored as local task material and are excluded from source-review archives.
The repository is now initialized on `main` with no commit and no remote.
Phase 0.1 is locally implemented and must still be reviewed by Jason before any
remote or deployment is created. This task created neither.

## Stack

- Next.js 16 App Router and React 19, strict TypeScript, Node 24
- exact pnpm 10 via `packageManager`
- PostgreSQL/Postgres.js, Drizzle ORM and generated migrations
- Better Auth email/password with no running-app sign-up
- Zod for environment, form, and domain validation
- React Markdown plus GFM, with raw HTML and images disabled
- Vitest, Playwright, axe, ESLint, and Prettier
- custom CSS tokens; Vercel and Neon-compatible PostgreSQL are intended targets

## Local setup

Prerequisites: Node 24, Corepack, Docker, and pnpm as pinned by `package.json`.

```bash
corepack enable
corepack prepare pnpm@10.34.5 --activate
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm db:up
pnpm db:migrate
pnpm admin:bootstrap
pnpm db:seed
pnpm dev
```

Replace every `.env.local` placeholder. Generate `BETTER_AUTH_SECRET` with a
cryptographically random value of at least 32 characters. `.env.local` is
ignored and must never be committed.

The bootstrap prompts for a hidden password when attached to a TTY. In a
non-interactive environment, read a secret without shell echo, export it as
`ADMIN_BOOTSTRAP_PASSWORD`, run `pnpm admin:bootstrap`, then unset it. The
command refuses a second account and never prints the password. Public sign-up
remains disabled in the running application.

If the single editor loses the password, run `pnpm admin:reset-password`. The
operator command accepts a masked password, verifies that exactly one database
user exists and matches `ADMIN_EMAIL`, uses Better Auth’s supported reset and
credential-account flow, and invalidates existing sessions. For a
non-interactive container only, provide `ADMIN_RESET_PASSWORD` through a
non-committed secret environment variable and unset it immediately afterward.
`ADMIN_RESET_EMAIL`, if supplied, must equal `ADMIN_EMAIL`. There is no
email-based or public self-service recovery flow in Phase 0.1.

Seed order is deliberate: reviewed public seed rows reference the already
bootstrapped editor. All seed content is generalized and public-safe.

## Command contract

| Purpose                      | Command                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------- |
| Development                  | `pnpm dev`                                                                        |
| Format / check               | `pnpm format` / `pnpm format:check`                                               |
| Lint / types                 | `pnpm lint` / `pnpm typecheck`                                                    |
| Unit / integration / browser | `pnpm test:unit` / `pnpm test:integration` / `pnpm test:e2e`                      |
| Production build             | `pnpm build`                                                                      |
| Database lifecycle           | `pnpm db:up`, `pnpm db:down`, `pnpm db:migrate`, `pnpm db:seed`                   |
| Schema generation / studio   | `pnpm db:generate`, `pnpm db:studio`                                              |
| First editor                 | `pnpm admin:bootstrap`                                                            |
| Editor password recovery     | `pnpm admin:reset-password`                                                       |
| Repository audits            | `pnpm audit:docs`, `pnpm audit:structure`, `pnpm audit:unused`, `pnpm audit:deps` |
| Complete verification        | `pnpm verify:full`                                                                |
| Safe review export           | `pnpm repo:export:dry-run`, `pnpm repo:export`                                    |

Integration and E2E checks require the local PostgreSQL service, applied
migrations, a synthetic editor, and seed data. CI performs those steps against
a disposable PostgreSQL service and never deploys.

## Architecture and privacy boundary

Anonymous routes never receive an entry unless SQL selected it with
`visibility = 'public'` and a currently routed kind (`translation` or `essay`).
`private` and `draft` mean authenticated-only. Incomplete translations may be
saved privately or as drafts; public translations require all four structured
fields.
Publication needs a human acknowledgment stored with the authenticated editor
identity and timestamp. De-publication removes an entry from anonymous detail,
indexes, sitemap, feed, and metadata because every surface repeats the public
predicate. Public edits retain their original publication time and require a
new acknowledgment; withdrawal retains historical chronology and deliberate
republication assigns a new publication time. Database outages render a
temporary-unavailability state rather than false emptiness or a false 404. See
[Architecture](docs/ARCHITECTURE.md) and
[Editorial model](docs/EDITORIAL-MODEL.md).

“Stored in PostgreSQL” does not mean zero-knowledge or end-to-end encrypted.
Provider and database operators may have technical access. Do not import actual
private workplace material until Jason has reviewed environment, backup, and
operational controls.

## Vercel and Neon plan

No Vercel or Neon resource exists yet. Create separate Neon branches/databases
for preview and production, configure independent secrets per Vercel
environment, apply migrations explicitly before runtime use, bootstrap the
single editor separately, and connect `velvetcrowbar.work` only after review.
Preview is noindexed and must never fall back to production data. Follow
[Environments](docs/ENVIRONMENTS.md).

A later Phase 0 technical deployment may quietly validate the real database,
headers, auth, and editorial workflow with the four safe seed entries. It is not
the editorial launch and must not be promoted as a mature publication. Phase 2
remains the deliberate public launch with deeper reviewed content. No deployment
is performed by this correction pass.

## Documentation map

- [Architecture and ownership](docs/ARCHITECTURE.md)
- [Editorial model](docs/EDITORIAL-MODEL.md)
- [Design brief](docs/DESIGN-BRIEF.md)
- [Environments](docs/ENVIRONMENTS.md)
- [Security and privacy](docs/SECURITY-AND-PRIVACY.md)
- [Change recipes](docs/CHANGE-RECIPES.md)
- [Roadmap](docs/ROADMAP.md)
- [Security reporting](SECURITY.md)
