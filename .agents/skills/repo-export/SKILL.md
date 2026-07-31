---
name: repo-export
description: Use when creating or refreshing a safe source-review archive of this repository after implementation and verification.
---

# Repository export

1. Inspect `git branch --show-current`, the base commit with `git rev-parse HEAD`
   (or report that no commit exists), `git status --short --branch`, and remotes.
2. Run `pnpm repo:export:dry-run`.
3. Review the complete included path list and the stated exclusions. Stop if a
   secret, local database, private-content export, or previous archive appears.
4. Run `pnpm verify:full` before creating the archive. Never represent an unrun
   check as passing.
5. Only after verification passes, run `pnpm repo:export`.
6. Do not edit source after archive creation.
7. If a relevant file changes, rerun verification as appropriate and recreate
   the archive; the prior archive no longer represents the source.
8. Report archive path, byte size, file count, SHA-256, branch, commit (including
   the no-commit state), and dirty state.

The archive is a source-review artifact. It is not a backup of database-resident
private editorial content.
