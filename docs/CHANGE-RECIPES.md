# Change recipes

Inspect current code, Git state, tests, and this ownership map before editing.

## Add an entry field

Update `src/db/schema.ts`, generate with `pnpm db:generate`, inspect SQL, update
the Zod boundary and snapshot type, repository transaction, studio form,
renderer if public, seed only if safe, and unit/integration/E2E tests. Apply with
`pnpm db:migrate`.

## Add a kind or visibility state

Kinds require both PostgreSQL enum and Zod enum changes plus navigation/rendering
decisions. Visibility changes are security architecture changes: update every
public predicate, constraint, metadata surface, form, seed, documentation, and
isolation test. Add a public kind to the fixed rule in
`src/features/entries/publication-policy.ts` only after its public detail route
exists. Do not add `unlisted` as a privacy substitute.

## Change rendering or editing

Change public Markdown only in `src/components/markdown.tsx` so public, studio,
and revision previews stay exact. Translation structure lives in
`src/components/translation-entry.tsx`; editing lives in
`src/components/studio-entry-form.tsx`. Run browser, unsafe-Markdown,
accessibility, 390px, overflow, focus, and reduced-motion checks.

## Add a public route

Compose a small Server Component under `src/app`; read through
`src/db/queries/public.ts`; add safe metadata, sitemap/feed behavior if relevant,
navigation, and anonymous isolation tests. Never reuse studio queries.

## Change auth

Start with `src/lib/auth.ts` and `src/lib/authorization.ts`, then the Better Auth
handler, client, schema/migration, bootstrap, environment guide, and auth tests.
Keep public registration disabled and repeat authorization in mutations.
Rate-limit changes also require `src/lib/auth-policy.ts`, the Better Auth schema
and migration, durable cross-instance tests, and documented proxy assumptions.
Test operator reset with only synthetic credentials; never print secrets or
write password hashes directly.

## Change schema or migration

Edit the Drizzle schema, run `pnpm db:generate`, read every generated statement,
run migrations from an empty disposable database and against a representative
existing state, then update tests/docs. Never hand-wave a destructive migration.

## Change public-read failure behavior

Keep visibility predicates and typed availability in
`src/db/queries/public.ts`. Preserve all three states: available/empty,
available/not-found, and unavailable. Log fixed metadata only. A sitemap or feed
outage should fail temporarily, not serialize a misleading empty publication.

## Change security headers

Change `src/lib/security-headers.ts`, then verify `next.config.ts` still scopes
the policy to every response. Test production/preview/development CSP and actual
public, sign-in, studio, auth, feed, sitemap, health, and asset responses. Do not
add wildcard hosts or production `unsafe-eval`; emit HSTS only for the canonical
production HTTPS environment.

## Change environment variables

Update server/public Zod schemas, `.env.example`, CI, Playwright, README, and
`docs/ENVIRONMENTS.md`. Ensure preview/production fail closed and build opens no
database connection.

## Change export behavior

Update `scripts/repo-export.ts`, export tests, `.gitignore`, and the repo-export
skill. Run dry-run, inspect included/excluded files, run verification, create a
fresh archive, and make no later edits.

## Publish a safe seed item

Generalize the observation until no name, organization, internal URL, exact
count, role fingerprint, unusual incident, proprietary detail, or unsupported
motive remains. Add it to `scripts/db-seed.ts`, retain explicit reviewed editor
identity, and test anonymous output. Seed content is public source code.

## Verify no private content leaks

Create only synthetic private/draft rows in the disposable test database. Probe
anonymous indexes and detail URLs, HTML/RSC network responses, metadata, sitemap,
feed, health, logs, and export. De-publish a formerly public synthetic row and
repeat every probe. Search generated output as well as rendered text.

## Modify the roadmap

Place a proposal in the appropriate phase in `docs/ROADMAP.md`; state permanent
editorial boundaries and dependencies. A roadmap entry does not authorize
implementation, publication, external AI use, or cloud resource creation.
