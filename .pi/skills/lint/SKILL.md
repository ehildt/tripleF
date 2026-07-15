---
name: lint
description: Linting, type-checking, dependency and dead-code analysis for the monorepo. Use when fixing ESLint/TypeScript errors, checking imports, or running quality scripts in dashboard or server.
---

# Linting & Static Analysis

This project uses **ESLint flat configs**, **TypeScript**, **Prettier**, and a small set of dependency/dead-code tools. Use the workspace scripts listed below rather than ad-hoc global installs. Do not edit `package.json`, `pnpm-workspace.yaml`, or any lock file unless explicitly asked.

## Available scripts

Both `dashboard/` and `server/` define the same quality scripts in `package.json`:

> **Important:** The root of the monorepo has its own `package.json`. Running `pnpm lint` from the project root executes the root workspace script, not the dashboard or server scripts. Always run lint/type-check commands from inside the target workspace (`dashboard/` or `server/`), or use the recursive filters below.

| Script                                                | What it runs                                                | Workspace |
| ----------------------------------------------------- | ----------------------------------------------------------- | --------- |
| `pnpm lint`                                           | ESLint over `./src` (+ `*.mjs` in dashboard)                | both      |
| `pnpm lint --fix`                                     | ESLint with auto-fix (from inside the workspace)            | both      |
| `pnpm -r --filter ./server lint`                      | Runs the `lint` script for `server` only                    | server    |
| `pnpm -r --filter ./dashboard lint`                   | Runs the `lint` script for `dashboard` only                 | dashboard |
| `pnpm -r --filter ./server --filter ./dashboard lint` | Runs `lint` for both server and dashboard                   | both      |
| `pnpm -r --filter ./server lint --fix`                | Recursive auto-fix for server only                          | server    |
| `pnpm -r --filter ./dashboard lint --fix`             | Recursive auto-fix for dashboard only                       | dashboard |
| `pnpm -r lint --fix --filter <workspace>`             | Recursive auto-fix for a single workspace                   | both      |
| `pnpm lint:unused`                                    | `ts-unused-exports` against `tsconfig.exclude.json`         | both      |
| `pnpm depcheck`                                       | `depcheck` to find unused/missing dependencies              | both      |
| `pnpm depcruise`                                      | `dependency-cruiser` for circular/orphan/dev-dep violations | both      |

Dashboard also has:

- `pnpm build` — runs `vue-tsc -b && vite build` (type-check + bundle).
- `pnpm test` — Vitest suite.

Server also has:

- `npx tsc --noEmit -p tsconfig.json` — full type check.
- `npx tsc --noEmit -p tsconfig.build.json` — build-time type check.
- `pnpm build` — NestJS build.
- `pnpm test` — Vitest suite.

## How to investigate and fix

1. **Run the failing workspace script from the correct directory.**
   - Change into the workspace first: `cd dashboard` or `cd server`.
   - Or run it recursively filtered from the monorepo root:
     - `pnpm -r --filter ./server lint`
     - `pnpm -r --filter ./dashboard lint`
     - `pnpm -r --filter ./server --filter ./dashboard lint` for both
   - Use `pnpm -r --filter ./server lint --fix` or `pnpm -r --filter ./dashboard lint --fix` if you want recursive auto-fix scoped to one workspace.
   - **Do not run `pnpm lint` from the monorepo root** unless you intentionally want the root workspace's own scripts.
   - If the script fails during `pnpm install` with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`, the lockfile supply-chain policy is blocking it. Report the exact packages and do **not** modify lockfiles or workspace config without explicit approval.

2. **For ESLint errors:**
   - Prefer fixing the source over disabling rules.
   - Run from inside `dashboard/` or `server/`, or use the recursive filtered form:
     - `pnpm -r --filter ./server lint --fix`
     - `pnpm -r --filter ./dashboard lint --fix`
   - Common dashboard fixes:
     - `sonarjs/concise-regex` — replace verbose character classes (`[0-9]`) with concise ones (`\d`).
     - `sonarjs/no-extra-arguments` — ensure the called function's signature matches the call site; if the function is stored in a variable, make sure the variable's type reflects the real signature (e.g. initialize with `vi.fn<IntersectionObserverCallback>()` instead of `() => undefined`).
     - `@typescript-eslint/no-unused-vars` — remove or use the binding; use `_` prefix only if the project config ignores it (currently it does not).
   - Auto-fix with `pnpm exec eslint --fix <path>` for formatting/Prettier issues, but review the diff.

3. **For TypeScript errors (`vue-tsc` / `tsc`):**
   - Read the error file and line.
   - Missing functions/variables often come from a half-implemented refactor. Either restore the missing symbol or update the call site.
   - Run from inside the target workspace:
     - Dashboard: `cd dashboard && pnpm exec vue-tsc --noEmit`
     - Server: `cd server && npx tsc --noEmit -p tsconfig.json`
   - Or use recursive filters:
     - `pnpm -r --filter ./dashboard build`
     - `pnpm -r --filter ./server build` (requires `POSTGRES_URL` etc. for Prisma)
     - `pnpm -r --filter ./dashboard --filter ./server build` for full build verification.

4. **For `ts-unused-exports`:**
   - Generated code (e.g. Prisma) and public/internal type exports often show up here. Do not blindly delete generated exports.
   - For hand-written code, remove or use the export; if it must stay public, consider re-exporting from a real consumer.

5. **For `depcheck`:**
   - Distinguish `dependencies` from `devDependencies`. A dev-only package used only in tests/stories is correctly in `devDependencies`.
   - Storybook addons and Chromatic reported as unused dev deps are usually expected if the stories are present.

6. **For `dependency-cruiser`:**
   - Circular warnings in generated Prisma files are expected; do not refactor generated code.
   - Circular warnings in application code require dependency inversion or moving shared symbols.
   - `not-to-dev-dep` errors mean production code imports a devDependency; move it to `dependencies` or isolate the import.

## What not to do

- Do not modify `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, or `.npmrc` to bypass failures.
- Do not add `eslint-disable` comments unless there is no clean fix.
- Do not run one-off global installs (e.g. `npm i -g eslint`) to work around workspace lockfile issues; use the workspace's own tooling or `npx --yes <pkg>` if the workspace install is blocked and you need a one-off diagnosis.

## Verification checklist

After any fix, run the relevant scripts in the correct workspace:

1. `cd dashboard && pnpm lint` or `cd server && pnpm lint` (or `pnpm -r --filter ./server --filter ./dashboard lint` from the root).
2. `pnpm lint:unused` (inside the workspace).
3. `pnpm build` (dashboard) or `npx tsc --noEmit -p tsconfig.json` (server).
4. `pnpm test`
5. `pnpm depcheck` and `pnpm depcruise` if dependencies were touched

Report any remaining failures with the exact command and output.
