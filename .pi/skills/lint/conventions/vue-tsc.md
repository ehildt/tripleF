# Vue TSC Convention

**Required for dashboard type-checking.** Official references: [Vue TypeScript tooling](https://vuejs.org/guide/typescript/overview.html) and [Vite build documentation](https://vitejs.dev/guide/build.html).

## Valid commands

From `apps/dashboard/`:

- `pnpm exec vue-tsc -b` checks the configured TypeScript project references in build mode.
- `pnpm exec vue-tsc --noEmit -p tsconfig.app.json` checks the application project directly.
- `pnpm build` runs Vue type-checking followed by the Vite production bundle.

The filtered dashboard build command is listed in [workspace scripts](../references/workspace-scripts.md).

## Avoid the false-green bare check

A bare `vue-tsc --noEmit` from the dashboard does not constitute verification. The dashboard root tsconfig has an empty file set plus project references, so that invocation can exit successfully without checking the application source.

Always select build mode or the application project explicitly and inspect output for the expected project scope. Do not report a bare invocation as a passing type-check.

## Diagnostic workflow

Read the actual Vue or TypeScript file and line. Check the component's imported prop and domain types, call sites, and selected application tsconfig. Missing symbols often indicate an incomplete rename or refactor; finish the rename rather than adding a compatibility alias.

Spec and story files can be excluded from application type-checking. Fixture drift in those files therefore requires the testing or Storybook guide's type-faithfulness rules rather than assuming this gate covers them.

## Completion checklist

- Build mode or `tsconfig.app.json` is explicitly selected.
- Output confirms real application sources were checked.
- The production build is used when bundle verification is also required.
- Excluded specs and stories are not claimed as type-checked.
- No false-green bare command or compatibility workaround was used.
