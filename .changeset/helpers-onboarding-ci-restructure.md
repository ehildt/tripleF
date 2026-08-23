---
"@triplef/triplef": minor
---

- Onboarded the publishable packages at `packages/*`: `@triplef/helpers` (ex-`@ehildt/ckir-helpers`) and `@triplef/config-factory` (ex-`@ehildt/nestjs-config-factory`), both rebranded to the `@triplef` scope and released from this repo via `publish-helpers` / `publish-config-factory` pipelines using npm trusted publishing (OIDC + provenance, no long-lived npm tokens)
- Converted to a single pnpm workspace: root `pnpm-workspace.yaml` declares `.` + `packages/*` + `apps/*`, one consolidated root lockfile replaces the per-app/package lockfiles, and the root package `@triplef/triplef` remains a changeset-versioned member
- CI reworked for the workspace: `ci.yml` does one root `pnpm install --frozen-lockfile` and verifies each workspace with `pnpm --filter <pkg>` (lint, depcruise, lint:unused, build, test:cov), uploading per-package dist artifacts for the release jobs
- Added `ncu-update.ci.yml` for scheduled dependency-update PRs covering `@triplef/helpers` and `@triplef/config-factory`
- Package docs migrated into the root `.wiki/`: helpers in sections `5.*`, config-factory in `6.*`; the `RELEASE_CI` wiki sync now covers them
- Apps (`@triplef/server`, `@triplef/memory`, `@triplef/dashboard`) renamed from the old `@triplef.io/*` scheme and updated to depend on / import the published `@triplef/helpers` and `@triplef/config-factory`
- Root changeset flow aligned with the workspace: `baseBranch` moved to `main`, stale `server/`/`dashboard/` changelog links fixed
