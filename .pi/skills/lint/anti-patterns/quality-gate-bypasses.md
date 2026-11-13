# Quality-Gate Bypass Anti-Patterns

Read this document before responding to a failing static gate with configuration, suppression, installation, or generated-code changes.

## Configuration bypasses

**Banned:** modifying `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, or `.npmrc` to bypass a failure without explicit approval; editing a lockfile by hand; or accepting automatic release-policy changes that were not requested.

**Required alternative:** diagnose the actual workspace, package, configuration, and error. Report policy failures exactly and request approval for intentional configuration changes. Review all dependency-command side effects together.

## Suppression as the default fix

**Banned:** adding eslint-disable comments, ignore rules, compiler relaxations, or dependency-rule exceptions merely to make output disappear.

**Required alternative:** fix source ownership, call sites, types, or dependencies first. A suppression requires a concrete unavoidable reason and must be reported explicitly.

## Global or shadow tooling

**Banned:** installing a global tool copy to work around the workspace lockfile or using a different tool version that shadows the configured installation.

**Required alternative:** use workspace scripts and local executables. If the workspace install is blocked and a one-off diagnosis is essential, the existing fallback is `npx --yes <pkg>` for diagnosis only; report its version and do not turn it into the project's execution path.

## False-green checks

**Banned:** treating a command that selects no source, project, workspace, or tests as successful verification. A bare dashboard `vue-tsc --noEmit` is the documented example.

**Required alternative:** select the intended project or workspace explicitly and inspect output for real coverage. Build, type-check, lint, test, and runtime verification are distinct claims.

## Generated-code edits

**Banned:** deleting exports, breaking cycles, or refactoring generated Prisma or other generated files to satisfy static analysis.

**Required alternative:** adjust the owning generator, source schema, analysis scope, or hand-written consumer boundary as appropriate. Generated output remains generated.

## Review checklist

- No unapproved configuration, lockfile, manifest, or policy change exists.
- No unexplained suppression or compiler weakening was introduced.
- Workspace-local tools and versions remain authoritative.
- Every claimed gate selected real targets.
- Generated output and remaining failures are reported honestly.
