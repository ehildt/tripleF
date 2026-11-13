# ESLint Convention

**Required when investigating or fixing lint failures.** The project uses ESLint flat configuration. Official references: [ESLint configuration files](https://eslint.org/docs/latest/use/configure/configuration-files) and [ESLint command line](https://eslint.org/docs/latest/use/command-line-interface).

## Reproduce in the correct workspace

Run `pnpm lint` from `apps/dashboard/` or `apps/server/`, or use the corresponding filtered command in [workspace scripts](../references/workspace-scripts.md). Do not use the unscoped repository-root command as a substitute.

Read the flat configuration that applies to the file and rule before changing source. Configuration cascading, file selection, and ignore behavior determine whether a rule actually applies.

## Fix source before suppressing rules

Prefer correcting the source over adding an eslint-disable comment. A disable is acceptable only when no clean fix exists and the reason is intentional; report it rather than using it as the default response.

Common dashboard diagnostics include:

- `sonarjs/concise-regex`: replace verbose character classes with the equivalent concise regular-expression escape.
- `sonarjs/no-extra-arguments`: align the call with the actual function signature. When a function is stored in a variable or test mock, type that variable with the real callback signature rather than hiding the mismatch behind an untyped no-op.
- `@typescript-eslint/no-unused-vars`: remove or use the binding. The current project configuration does not ignore an underscore-prefixed binding, so renaming with an underscore is not a fix.

Missing functions or variables often indicate an incomplete refactor. Restore the intended symbol or update its call sites rather than suppressing the report.

## Auto-fix carefully

From the target workspace, `pnpm lint --fix` applies the script's auto-fix. For a scoped path, `pnpm exec eslint --fix <path>` can be used from that workspace.

Review the resulting diff, including formatting and Prettier-related fixes. Auto-fix is project-native tooling, not proof that the resulting semantics or conventions are correct. Do not run broad formatting or lint fixes outside the approved scope merely to reduce unrelated noise.

## Completion checklist

- The failure was reproduced with the correct flat config and workspace.
- Source and call sites were fixed before considering suppression.
- Rule-specific fixes preserve actual function and callback contracts.
- Auto-fix changes are scoped and reviewed.
- No unjustified disable, global tool installation, or configuration bypass remains.
