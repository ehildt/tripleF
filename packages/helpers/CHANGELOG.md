# @triplef/helpers

## 1.5.1

### Patch Changes

- fix: add prettier as a direct devDependency so `changeset version` can format the CHANGELOG in CI (pnpm 10 does not link binaries of auto-installed peer dependencies into `node_modules/.bin`)

  Also: pin the pnpm version via `packageManager`, and update the GitHub Actions workflows to the same action versions used by tripleF (checkout v7, pnpm/action-setup v6, setup-node v7, codecov v7, upload-artifact v7, download-artifact v8, git-auto-commit v7), including a reusable `ci.yml` and a lockfile-sync step in the ncu-update workflow.

- updated dependencies

## 1.5.0

### Minor Changes

- 2c42f29: Add is-buffer-or-serialized module with cross-platform buffer detection

  - Added `isBufferOrSerialized()` - universal buffer detection for Node.js and browsers
  - Added helper functions: `isActualArrayBuffer()`, `isActualSharedArrayBuffer()`, `isNodeBuffer()`, `isSerializedBuffer()`, `getObjectClass()`
  - Added types: `BufferLike`, `SerializedBuffer`
  - Cross-realm safe checks (works across iframes and workers)
  - Spoof protection against Symbol.toStringTag manipulation
  - Supports: Buffer, ArrayBuffer, SharedArrayBuffer, TypedArray, DataView, and serialized buffer format
  - Browser and Node.js compatible

## 1.4.0

### Minor Changes

- 18015e9: Add findUp helper and enhance readPackageJsonFromRoot

  - Added `findUp()` helper function that recursively searches for a file by traversing up the directory tree
  - Enhanced `readPackageJsonFromRoot()` to accept optional `filename` and `startDir` parameters for custom file discovery
  - `readPackageJsonFromRoot()` now throws an error if the file is not found
  - Updated exports to include the new `findUp` helper

## 1.3.3

### Patch Changes

- e0c2239: Fixed CI/CD workflows across sibling projects:
  - Added CICD_ACTIONS PAT token to ncu-update workflows for automated PR creation
  - Added missing actions:read permissions to release workflows for artifact downloads

## 1.3.2

### Patch Changes

- 09f95e7: Fix release CI not publishing built artifacts

## 1.3.1

### Patch Changes

- 5ae479a: Add optional health configuration to app config schema
  Add tests and improve coverage to 100%
  Update wiki with field descriptions
  Add codecov badge to statusBadges

## 1.3.0

### Minor Changes

- bbe7f08: Add getByteSizeEnv helper for parsing byte size environment variables.

  - Add getByteSizeEnv function with support for B, KB, MB, GB, TB units
  - Support decimal values (e.g. 1.5MB)
  - Handle case insensitivity
  - Add graceful fallback handling
  - Fix getBooleanEnv to handle case insensitivity

## 1.2.3

### Patch Changes

- 3872c1b: Fix ESM export by removing `".": null` from package.json exports. This resolves ERR_PACKAGE_PATH_NOT_EXPORTED error in Node.js v24+.

## 1.2.2

### Patch Changes

- 6759329: improve README badges and add section headers

## 1.2.1

### Patch Changes

- 3d4f7bb: Fix exports field ordering to prioritize types before import

  Reordered the exports conditions in package.json so that "types" comes before "import" for all subpath exports. This fixes TypeScript module resolution issues when using `node16`, `nodenext`, or `bundler` moduleResolution settings.

## 1.2.0

### Minor Changes

- aac37f0: Enforce explicit import paths by blocking root and dist imports

### Patch Changes

- aac37f0: fixed explicit exporting path

## 1.1.0

### Minor Changes

- 85631ed: Enforce explicit import paths by blocking root and dist imports

## 1.0.1

### Patch Changes

- 3b911e2: Rename .wiki files to lowercase for consistency

## 1.0.0

### Major Changes

- aae714d: Initial release of ckir-helpers library

  Added:

  - bootstrap module with NestJS app configuration utilities
  - get-boolean-env for parsing boolean env vars
  - get-number-env for parsing numeric env vars
  - hash-payload for SHA-256/384/512 hashing
  - object-io with clone, isEmpty, merge, omit, pick utilities
  - text-to-lines for sentence splitting (Western + CJK punctuation)

  Documentation:

  - README.md with badges
  - Wiki documentation for all modules
  - depbadgerc.yml for automated badge generation
