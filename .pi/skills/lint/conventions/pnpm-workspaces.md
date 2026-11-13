# pnpm Workspace Convention

**Required when choosing workspace commands or handling installation policy.** Official references: [pnpm workspaces](https://pnpm.io/workspaces), [recursive commands](https://pnpm.io/cli/recursive), and [filtering](https://pnpm.io/filtering).

## Select the actual workspace

Application quality scripts belong to `apps/dashboard/` and `apps/server/`. Either change into that directory or use an explicit recursive path filter from the repository root. The exact command matrix is in [workspace scripts](../references/workspace-scripts.md).

Recursive execution excludes the root project for script-style commands unless configured otherwise. Do not assume a root command runs application scripts. Confirm selected projects from output rather than treating a zero exit with no matching project as verification.

Use project-native pnpm scripts and executables. Do not install global copies of ESLint, TypeScript, or other workspace tools to bypass the lockfile.

## Configuration and lockfile boundaries

Do not modify `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, or `.npmrc` to bypass a failure without explicit user approval. Do not edit lockfiles by hand.

After adding or removing packages, review the manifest, lockfile, and workspace definition together. Revert automatic changes such as release-age exclusions when they were not explicitly approved. Preserve the workspace's existing dependency-verification settings rather than weakening them for convenience.

Published package dependencies follow the repository's standalone publishing workflow; do not replace their ranges with workspace protocol references as a shortcut.

## Install and release-policy failures

If an install or script-triggered dependency operation fails with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`, the lockfile supply-chain policy is blocking the operation. Report the exact packages and error.

Do not modify lockfiles, workspace configuration, release-age exclusions, or dependency-verification settings without explicit approval. Use the existing workspace installation for diagnosis whenever possible.

## Prose examples

- A dashboard lint failure is reproduced from `apps/dashboard` or through the dashboard path filter, not through an unscoped root command.
- A recursive command that matches no workspace is corrected rather than reported as a successful lint run.
- A dependency command that changes workspace release policy is not accepted silently; the unapproved side effect is reverted and reported.

## Completion checklist

- Workspace selection is explicit and confirmed by output.
- Existing scripts and local tools are used.
- Manifest, lockfile, workspace, and npm configuration remain untouched unless approved.
- Dependency side effects and release-policy failures are reported exactly.
