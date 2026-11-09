# @triplef/bullmq

## 1.1.4

### Patch Changes

- a46f5c6: chore: add prettier as a direct devDependency

  - Declare `prettier` (^3.9.6) in devDependencies — it was previously only
    available transitively via `eslint-plugin-prettier`.
  - Add the prettier badge to `depbadgerc.yml` and refresh README badges to the
    current dependency versions.

- 9d2ffc6: chore: modernize CI/CD and migrate husky hooks

  - Extract shared lint/build/test pipeline into a reusable `ci.yml` workflow
    used by both the non-release and release pipelines (mirrors ckir-helpers).
  - Bump GitHub Actions to latest majors (checkout@v7, setup-node@v7,
    pnpm/action-setup@v6, upload/download-artifact, codecov@v7) and Node 24.
  - Pin pnpm via `packageManager` (pnpm@11.22.0) and approve required build
    scripts in `pnpm-workspace.yaml`.
  - `ncu-update` now syncs the lockfile and regenerates README badges.
  - Migrate `.husky` hooks from ckir.io-visions (shared `prepare.sh`, depcheck
    in pre-push, commit message format/length checks).

## 1.1.3

### Patch Changes

- 7d6a3e0: Bump devDependencies and fix CI workflows: add missing `actions: read` permission and `actions/download-artifact` step in release CI; add custom token to automated dependency update PR; update pre-push hooks to include `test:cov` and `depcheck` checks.

## 1.1.0

### Minor Changes

- ddfce15: Consolidate exports into single entry point, clean up type names, and extend test coverage

  - Consolidate exports into single entry point (`src/index.ts`)
  - Delete old index files (`src/models/index.ts`, `src/module/index.ts`, `src/schema/index.ts`)
  - Rename `BullMQQueueConfig` to `QueueConfig`
  - Rename `BullMQQueue` to `Queue`
  - Change `imports?: any[]` to `imports?: ModuleMetadata["imports"]`
  - Update `BullMQConfigFactory` to allow sync return (`Promise<BullMQConfig> | BullMQConfig`)
  - Fix factory output to handle null with nullish coalescing (`?? {}`)
  - Add `reflect-metadata` dev dependency for testing
  - Extend test coverage with 8 new tests using `@nestjs/testing`
  - Update `tsup.config.ts` to use single entry point
  - Update `package.json` exports to single entry point

## 1.0.4

### Patch Changes

- f956ba0: added global field to queues

## 1.0.2

### Patch Changes

- f1a7810: fixed subpath exports for main

## 1.0.1

### Patch Changes

- 4603c4a: added ignoreDeprecations to tsconfig and updated the package.json

## 1.0.0

### Major Changes

- 8f1eb32: Init release

### Patch Changes

- ea5733f: Add unit tests for BullMQModule and BullMQConfigSchema
