# Security and privacy

## Threat model and controls

| Threat                         | Phase 0 control                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| Accidental publication         | default private; routed-kind/complete-translation validation; fresh human review    |
| Public query leakage           | SQL requires public visibility and a supported routed kind; isolation tests         |
| Public-read outage ambiguity   | typed unavailable state, safe metadata-only diagnostic, failing sitemap/feed        |
| Unauthenticated studio         | Better Auth session plus server-side `ADMIN_EMAIL` match on layouts/actions         |
| Preview uses production data   | no environment fallback; separate documented database and secret                    |
| Content in logs                | mutation errors are generic; no body/token logging                                  |
| Markdown injection             | raw HTML skipped, unsafe schemes rejected, images suppressed, no MDX                |
| Secrets in Git/export          | `.gitignore`, audits, path-based export rejection                                   |
| Metadata leak                  | sitemap/feed/detail metadata use only public queries                                |
| Compromised editor credentials | operator-only Better Auth reset revokes sessions; strong unique secret/password     |
| Distributed sign-in attempts   | Better Auth durable PostgreSQL limiter in preview/production; bounded IP assumption |
| Browser injection/clickjacking | static CSP, frame denial, MIME/referrer/permissions and cross-origin headers        |
| Provider/operator access       | honest limitation; database is not zero-knowledge or end-to-end encrypted           |

The health route exposes only service, coarse environment, status, and an
optional intentionally public build label. Database URL, admin email, content
counts, host details, and commits are absent.

Unexpected anonymous-read diagnostics contain only a fixed event, operation,
route kind, coarse environment, and constrained error name. They exclude slugs,
content, SQL, connection details, cookies, sessions, and authorization data.
Available/not-found still reveals nothing about whether a private/draft slug
exists.

The static CSP allows same-origin Next.js runtime code plus its required inline
bootstrap and styles; development alone permits `unsafe-eval` and WebSocket
connections. It denies frame embedding, frame loading, and objects, and
declares no external fonts, images, analytics, AI, or storage hosts. HSTS is
emitted only in production HTTPS; preview and local development omit it. The
policy also sets `nosniff`, `DENY`, strict-origin referrers, restricted browser
permissions, COOP, and CORP across pages, studio, auth, feed, sitemap, health,
and assets.

## Important limitations

Phase 0.1 is not production-hardened merely because it can deploy. Database and
hosting operators may access stored data. App-layer field encryption, encrypted
backups, database recovery, rate-limit tuning, incident response, and routine
credential rotation procedures need operational work. The IP policy assumes
Vercel overwrites the deployed forwarded header; an added upstream proxy
requires re-review. Rate limiting reduces abuse but is not complete abuse
prevention. The publication checklist cannot guarantee
anonymity, legal safety, or factual correctness.

Do not place private content in Git, fixtures, screenshots, seeds, comments,
analytics, logs, or source archives. The review export backs up source only—not
database content.

## Security review checklist

- prove public predicates on lists and slug lookups;
- probe anonymous studio access and wrong-editor sessions;
- probe Better Auth sign-up rejection;
- reset the only synthetic editor, prove old sessions/password fail, and prove
  the new password succeeds;
- exhaust auth rate limits, recreate the auth instance, inspect durable state,
  advance expiry, and retry;
- publish, de-publish, then inspect HTML, RSC responses, sitemap, feed, metadata;
- break a disposable public database read and distinguish unavailable from
  empty/not-found;
- inspect CSP and security headers on public, studio, auth, asset, feed, sitemap,
  and health responses;
- test scripts, styles, iframes, event handlers, and unsafe Markdown URLs;
- build with database unavailable;
- inspect logs for bodies, tokens, URLs, and credentials;
- run export dry-run and examine every included path.
