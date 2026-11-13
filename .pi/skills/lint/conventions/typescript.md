# TypeScript Diagnostic Convention

**Required when investigating server TypeScript or project-selection failures.** Vue checking additionally requires [Vue TSC](vue-tsc.md). Official references: [TypeScript project references](https://www.typescriptlang.org/docs/handbook/project-references.html) and [TSConfig](https://www.typescriptlang.org/tsconfig/).

## Read the actual project and error

Start with the reported file, line, and selected TypeScript project. Missing functions or variables often come from a partially completed refactor. Restore the intended symbol or update every call site rather than adding an untyped compatibility layer.

Confirm which tsconfig includes the file, its strictness and module settings, and whether the command builds project references or checks only one project. A zero exit from a configuration with no selected source is not a type-check.

## Server commands

From `apps/server/`:

- `pnpm exec tsc --noEmit -p tsconfig.json` performs the full configured type-check.
- `pnpm exec tsc --noEmit -p tsconfig.build.json` checks the build project.
- `pnpm build` runs the existing Nest build script and its prebuild generation behavior.

Use the filtered build form in [workspace scripts](../references/workspace-scripts.md) when running from the repository root. The server build can require its configured Prisma environment because of generation; distinguish that operational failure from TypeScript diagnostics.

Do not replace the configured project with an ad-hoc file list or weaken compiler options to make errors disappear.

## Dashboard boundary

Dashboard type-checking uses `vue-tsc`, not a bare assumption that server `tsc` covers Vue SFCs. Follow [Vue TSC](vue-tsc.md) for its build-mode and application-project commands.

## Completion checklist

- The error's source file, call sites, and owning tsconfig were inspected.
- The selected command checks real source and the intended project references.
- Server full, build-project, and build verification are not conflated.
- No compiler option or source contract was weakened to bypass the failure.
