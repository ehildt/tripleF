---
'@triplef/server': minor
'@triplef/memory': minor
---

Migrated both apps from their local `pino-logger` modules to the published `@triplef/core-logger` package:

- Replaced `PinoLoggerService`/`PinoLoggerModule` with `CoreLoggerService`/`CoreLoggerModule.registerAsync`, wired through a new app-level `CoreLoggerConfigService` (`@CacheReturnValue(CoreLoggerSchema)`).
- Logging now renders the NestJS context inline as `[Context] message` (via the pino-pretty `messageFormat` + `ignore: 'pid,hostname,context'`), preserves error stacks, and supports `setLogLevels` and per-call `onLog` hooks.
- Bumped `@triplef/config-factory` to `^1.1.4` (root export).
- Removed the unused `json5` dependency.
