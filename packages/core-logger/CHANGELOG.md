# @triplef/core-logger

## 1.0.3

### Patch Changes

- 5a7ab35: Switch all first-party code to the PolyForm Strict License 1.0.0. Noncommercial use remains permitted for individuals, companies, and other organizations, but modification, redistribution, and commercial use require separate permission from the copyright holder.

  Update package license metadata, license badges, project descriptions, and contribution guidance to match. Third-party dependencies remain subject to their original licenses. Versions previously released under MIT or AGPL terms remain available under those terms.

## 1.0.0

### Major Changes

- 13383bb: Initial release of the pino-backed NestJS logger:

  - `CoreLoggerService` — a `LoggerService` that normalizes NestJS call shapes (`log(message, context)`, `error(message, stack, context)`, and the meta-object-first/second forms) into pino calls, with inline `[Context]` rendering, error-stack preservation, `setLogLevels` support, and per-call `onLog` hooks.
  - `CoreLoggerModule` — a dynamic module (`registerAsync`) that wires the service to caller-supplied pino `LoggerOptions`.
  - `CoreLoggerSchema` — an exported Joi schema for validating pino `LoggerOptions`.
