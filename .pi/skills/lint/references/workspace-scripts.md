# Workspace Script Reference

Use this lookup when selecting an exact command. Commands are defined by the current workspace manifests; do not assume the monorepo root provides the same scripts.

## Direct workspace execution

Run from `apps/dashboard/` or `apps/server/` when working inside one application.

| Script or command | Dashboard | Server |
| --- | --- | --- |
| Lint | `pnpm lint` | `pnpm lint` |
| Lint with auto-fix | `pnpm lint --fix` | `pnpm lint --fix` |
| Dead exports | `pnpm lint:unused` | `pnpm lint:unused` |
| Dependency usage | `pnpm depcheck` | `pnpm depcheck` |
| Dependency graph | `pnpm depcruise` | `pnpm depcruise` |
| Tests | `pnpm test` | `pnpm test` |
| Build | `pnpm build` | `pnpm build` |
| Full type-check | Use the Vue TSC guide | `pnpm exec tsc --noEmit -p tsconfig.json` |
| Build-project type-check | `pnpm exec vue-tsc -b` | `pnpm exec tsc --noEmit -p tsconfig.build.json` |

Dashboard lint covers `src` and root `*.mjs` configuration files. Server lint covers `src`. Dashboard build runs Vue type-checking followed by the Vite bundle. Server build uses the Nest build project and has a Prisma-generation prebuild step.

## Recursive execution from the repository root

Use path filters rooted at the actual workspace directories:

- Dashboard lint: `pnpm -r --filter ./apps/dashboard lint`.
- Server lint: `pnpm -r --filter ./apps/server lint`.
- Both: `pnpm -r --filter ./apps/server --filter ./apps/dashboard lint`.
- Dashboard auto-fix: `pnpm -r --filter ./apps/dashboard lint --fix`.
- Server auto-fix: `pnpm -r --filter ./apps/server lint --fix`.
- Dashboard build: `pnpm -r --filter ./apps/dashboard build`.
- Server build: `pnpm -r --filter ./apps/server build`.
- Both builds: `pnpm -r --filter ./apps/dashboard --filter ./apps/server build`.

The same filtering form applies to `test`, `lint:unused`, `depcheck`, and `depcruise` when those scripts are required.

## Important root distinction

Running `pnpm lint` from the repository root selects the root manifest's script inventory, not the dashboard or server scripts. The root currently has no application lint script. Use a direct workspace directory or an explicit filter.

## Command selection checklist

- The working directory or filter selects `apps/dashboard` or `apps/server` as intended.
- The script exists in that workspace's current manifest.
- Build, type-check, and test commands are not treated as interchangeable.
- Server build environment and Prisma-generation requirements are accounted for.
- Output confirms that real source files or tests were selected.
