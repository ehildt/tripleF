# Depcheck Convention

**Required when investigating unused or missing dependency reports.** Official reference: [depcheck](https://github.com/depcheck/depcheck).

Run `pnpm depcheck` inside `apps/dashboard/` or `apps/server/`, or use the corresponding filtered workspace command. Inspect the actual imports and the manifest rather than deleting every reported entry automatically.

## Dependency classification

Distinguish production `dependencies` from `devDependencies`. A package used only by tests, stories, configuration, or development tooling normally belongs in development dependencies. A package required by production source belongs in production dependencies.

Storybook addons and Chromatic can appear unused to static analysis while stories and Storybook configuration use them through convention. Their presence alongside active stories is usually expected; inspect the configuration before treating them as dead.

A missing dependency report means source imports a package not declared by that workspace. Add or correct the dependency only with approval and through the workspace's normal package workflow. A package hoisted by pnpm is not implicitly licensed for an undeclared application import.

## Review side effects

Dependency changes require review of the manifest, lockfile, and workspace definition together. Revert unapproved automatic policy or configuration changes. Do not change dependency classification merely to silence a report without checking runtime ownership.

## Completion checklist

- Every reported package was traced to actual runtime, test, story, or configuration usage.
- Production and development ownership are based on real consumers.
- Conventional Storybook and generated integrations were inspected before removal.
- Missing and unused reports are resolved through approved workspace-native dependency changes.
- Manifest, lockfile, and workspace side effects were reviewed.
