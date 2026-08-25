---
'@triplef/core-logger': major
---

Initial release of the pino-backed NestJS logger:

- `CoreLoggerService` — a `LoggerService` that normalizes NestJS call shapes (`log(message, context)`, `error(message, stack, context)`, and the meta-object-first/second forms) into pino calls, with inline `[Context]` rendering, error-stack preservation, `setLogLevels` support, and per-call `onLog` hooks.
- `CoreLoggerModule` — a dynamic module (`registerAsync`) that wires the service to caller-supplied pino `LoggerOptions`.
- `CoreLoggerSchema` — an exported Joi schema for validating pino `LoggerOptions`.
