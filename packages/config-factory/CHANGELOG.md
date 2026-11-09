# @triplef/config-factory

## 1.2.0

### Minor Changes

- 36adb77: Expose a root export (`@triplef/config-factory`) that re-exports the full public API (`ConfigFactoryModule`, `CacheReturnValue`, `ValidateReturnValue`, and their types). Consumers can now import `ConfigFactoryModule` from the package root instead of the repetitive `@triplef/config-factory/config-factory` subpath. Existing subpath exports remain available for backward compatibility.

### Patch Changes

- Updated dependencies [ec0d0a5]
- Updated dependencies [be7ff5f]
- Updated dependencies [36adb77]
- Updated dependencies [4a03c4d]
  - @triplef/helpers@1.6.0

## 1.1.4

### Patch Changes

- 3368f54: - Rebranded from `@ehildt/nestjs-config-factory` to `@triplef/config-factory`: package name, README, badges, changelog title, and wiki docs now use the `@triplef` scope
  - `repository.url` corrected to `https://github.com/ehildt/tripleF.git`
  - Peer dependency updated from `@ehildt/ckir-helpers` to `@triplef/helpers`
  - Apps (`@triplef/server`, `@triplef/memory`) updated to depend on and import the new package
  - Package docs migrated into the tripleF monorepo wiki (sections `6.*`)
  - Published with npm trusted publishing (OIDC, provenance) via the monorepo `RELEASE_CI` pipeline — no long-lived npm tokens
- Updated dependencies [3368f54]
  - @triplef/helpers@1.5.2

## 1.1.3

### Patch Changes

- 8e12a4e: updated dependencies and fixed ci/cd

## 1.1.2

### Patch Changes

- 4175015: Fix CacheReturnValue to accept number as TTL shorthand in type declaration

## 1.1.1

### Patch Changes

- ac0ba4a: - Add support for number as shorthand for TTL config (e.g., `@CacheReturnValue(5000)`)

## 1.1.0

### Minor Changes

- 6b89ba7: Add TTL support and stale-while-revalidate to CacheReturnValue decorator

  - Cache entries now expire after 5 minutes by default
  - Support `ttl` option to customize expiration time (in milliseconds)
  - Support `false` for permanent caching
  - Stale-while-revalidate strategy: returns stale value immediately while refreshing in background
  - Accept number directly as TTL shorthand (e.g., `@CacheReturnValue(60000)`)
  - Accept config object with `schema` and `ttl` properties
  - Shared refresh promise prevents duplicate fetches during concurrent reads

## 1.0.0

### Major Changes

- 7f13e0d: Initial release with CacheReturnValue, ConfigFactoryModule, and ValidateReturnValue decorators
