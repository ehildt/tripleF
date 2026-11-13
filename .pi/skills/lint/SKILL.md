---
name: lint
description: Linting, type-checking, dependency and dead-code analysis for the monorepo. Use when fixing ESLint, TypeScript, or Vue type-check errors, checking imports, running pnpm workspace quality scripts, or investigating dependency and unused-export reports.
---

# Static Analysis Router

Use the workspace's own scripts and tool guides. The actual application workspaces are `apps/dashboard/` and `apps/server/`; the monorepo root has its own manifest and does not share their quality scripts.

## Route the task

| Task | Read |
| --- | --- |
| Look up exact workspace lint, build, test, dependency, or dead-code commands | [Workspace scripts](references/workspace-scripts.md) |
| Choose the correct workspace, recursive filter, or working directory; handle install policy | [pnpm workspaces](conventions/pnpm-workspaces.md) |
| Fix ESLint or formatting-related lint failures | [ESLint](conventions/eslint.md) |
| Fix TypeScript errors or choose a server TypeScript project | [TypeScript](conventions/typescript.md) |
| Run Vue type-checking or diagnose a false-green `vue-tsc` result | [Vue TSC](conventions/vue-tsc.md) |
| Investigate unused or missing dependencies | [Depcheck](conventions/depcheck.md) |
| Investigate circular, orphan, or production-to-development dependency violations | [Dependency Cruiser](conventions/dependency-cruiser.md) |
| Investigate dead-export reports | [Unused exports](conventions/unused-exports.md) |
| Consider a disable, global install, generated-code edit, or config workaround | [Quality-gate bypasses](anti-patterns/quality-gate-bypasses.md) |
| Verify a completed fix | [Verification](quality/verification.md) |

## Always apply

- Run the failing tool in the correct workspace or use an explicitly scoped recursive filter.
- Use workspace scripts and locally installed tools rather than ad-hoc global installations.
- Do not modify manifests, lockfiles, workspace configuration, or npm configuration to bypass a failure without explicit approval.
- Prefer a clean source fix over disabling a rule. Review every auto-fix diff.
- Read the actual error file, line, configuration, and call sites before changing code.
- Do not delete or refactor generated code to silence diagnostics.
- A command that selects no real project or source files is not verification.
- Existing tests run after code changes. Creating or updating tests requires consent, and a breaking test is reported before either implementation or test is modified.
- Inspect manifest, lockfile, and workspace-definition side effects after dependency changes; revert unapproved automatic policy changes.
- Report remaining failures with the exact command and relevant output.

## Completion checklist

- Every selected tool guide matches the actual failure and workspace.
- No configuration bypass, generated-code edit, or unreviewed auto-fix was introduced.
- The final verification sequence is scoped to touched code and dependencies.
- False-green checks and unrun rendered or runtime behavior are reported explicitly.
