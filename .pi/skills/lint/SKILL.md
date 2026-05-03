---
name: lint
description: Linting, type-checking, dependency and dead-code analysis for the monorepo. Use when fixing ESLint/TypeScript errors, checking imports, or running quality scripts in dashboard or server.
---

# Linting & Static Analysis

This project uses **ESLint flat configs**, **TypeScript**, **Prettier**, and a small set of dependency/dead-code tools. Use the workspace scripts listed below rather than ad-hoc global installs. Do not edit `package.json`, `pnpm-workspace.yaml`, or any lock file unless explicitly asked.

## Available scripts

Both `dashboard/` and `server/` define the same quality scripts in `package.json`:

| Script             | What it runs                                                | Workspace |
| ------------------ | ----------------------------------------------------------- | --------- |
| `pnpm lint`        | ESLint over `./src` (+ `*.mjs` in dashboard)                | both      |
| `pnpm lint:unused` | `ts-unused-exports` against `tsconfig.exclude.json`         | both      |
| `pnpm depcheck`    | `depcheck` to find unused/missing dependencies              | both      |
| `pnpm depcruise`   | `dependency-cruiser` for circular/orphan/dev-dep violations | both      |

Dashboard also has:

- `pnpm build` — runs `vue-tsc -b && vite build` (type-check + bundle).
- `pnpm test` — Vitest suite.

Server also has:

- `npx tsc --noEmit -p tsconfig.json` — full type check.
- `npx tsc --noEmit -p tsconfig.build.json` — build-time type check.
- `pnpm build` — NestJS build.
- `pnpm test` — Vitest suite.

## How to investigate and fix

1. **Run the failing workspace script first.**
   - If the script fails during `pnpm install` with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`, the lockfile supply-chain policy is blocking it. Report the exact packages and do **not** modify lockfiles or workspace config without explicit approval.
   - If the script runs, capture the full output (file paths, rule names, line numbers).

2. **For ESLint errors:**
   - Prefer fixing the source over disabling rules.
   - Common dashboard fixes:
     - `sonarjs/concise-regex` — replace verbose character classes (`[0-9]`) with concise ones (`\d`).
     - `sonarjs/no-extra-arguments` — ensure the called function's signature matches the call site; if the function is stored in a variable, make sure the variable's type reflects the real signature (e.g. initialize with `vi.fn<IntersectionObserverCallback>()` instead of `() => undefined`).
     - `@typescript-eslint/no-unused-vars` — remove or use the binding; use `_` prefix only if the project config ignores it (currently it does not).
   - Auto-fix with `pnpm exec eslint --fix <path>` for formatting/Prettier issues, but review the diff.

3. **For TypeScript errors (`vue-tsc` / `tsc`):**
   - Read the error file and line.
   - Missing functions/variables often come from a half-implemented refactor. Either restore the missing symbol or update the call site.
   - Run `vue-tsc -b` (dashboard) or `tsc --noEmit -p tsconfig.json` (server) after any change.

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

After any fix, run the relevant scripts in order:

1. `pnpm lint`
2. `pnpm lint:unused`
3. `pnpm build` (dashboard) or `npx tsc --noEmit -p tsconfig.json` (server)
4. `pnpm test`
5. `pnpm depcheck` and `pnpm depcruise` if dependencies were touched

Report any remaining failures with the exact command and output.
