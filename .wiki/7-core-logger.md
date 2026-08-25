# 7. Core-Logger: The @triplef/core-logger Library

A lightweight NestJS `LoggerService` backed by pino — structured logging with inline context rendering and error-stack preservation. `@triplef/core-logger` is published to npm as an **ESM-only** package.

> This library is **ESM-only** and does not support CommonJS. Your project must use ES modules.

## Modules

| Module | Description |
| --- | --- |
| [7.1. Core-Logger Service](7.1-core-logger-service.md) | NestJS `LoggerService` that normalizes call shapes into pino calls |
| [7.2. Core-Logger Module](7.2-core-logger-module.md) | Dynamic module (`registerAsync`) wiring the service to pino options |
| [7.3. Core-Logger Schema](7.3-core-logger-schema.md) | Joi schema for validating pino `LoggerOptions` |

## Installation

```bash
npm install @triplef/core-logger
```

## Peer Dependencies

```bash
npm install @nestjs/common joi pino pino-pretty
```
