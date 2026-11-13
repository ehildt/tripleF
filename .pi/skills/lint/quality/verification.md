# Static Fix Verification

**Required after fixing lint, type, dependency, or dead-code failures.** Run only the gates relevant to the touched workspace and change, using [workspace scripts](../references/workspace-scripts.md) for exact forms.

Official test reference: [Vitest](https://vitest.dev/guide/).

## Verification sequence

1. Run `pnpm lint` in each touched application workspace, or use the explicitly scoped filtered form for both.
2. Run `pnpm lint:unused` in the touched workspace when exports or public types changed.
3. Verify types and builds:
   - Dashboard: use the valid Vue TSC command for the required scope and `pnpm build` when bundle verification is needed.
   - Server: use the full `tsc` project check and `pnpm build` when build verification is needed, accounting for its Prisma-generation environment.
4. Run existing `pnpm test` coverage in each touched application workspace after code changes.
5. Run `pnpm depcheck` and `pnpm depcruise` when dependencies or import ownership changed, and when resolving their existing reports.

Creating or updating tests requires explicit consent. Existing tests are a regression net and contract, not infallible proof. Investigate failures and report a breaking change before modifying either implementation or test.

## Review the result

- Confirm every command selected the intended workspace and real targets.
- Review auto-fix and formatting diffs rather than accepting them blindly.
- Inspect dependency manifests, lockfile, and workspace definition after dependency operations.
- Revert unapproved automatic changes such as release-policy exclusions.
- Distinguish static success from runtime, rendered, database, and module-graph behavior that was not exercised.
- Report every remaining failure with its exact command and relevant output.

## Completion checklist

- Relevant lint, type/build, dead-export, dependency, and existing-test gates ran in the correct workspaces.
- No false-green or unrelated broad command is presented as scoped verification.
- Auto-fixes and dependency side effects were reviewed.
- Unrun behavior and remaining failures are explicitly reported.
