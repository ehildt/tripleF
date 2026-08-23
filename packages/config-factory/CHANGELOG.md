# @triplef/config-factory

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
