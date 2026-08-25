# 9. BullMQ-Logger: The @triplef/bullmq-logger Library

A NestJS logger for BullMQ jobs powered by pino — emoji state indicators, failed-reason/stacktrace capture, and safe state inference when `job.getState()` is unavailable. `@triplef/bullmq-logger` is published to npm as an **ESM-only** package.

> This library is **ESM-only** and does not support CommonJS. Your project must use ES modules.

## Modules

| Module | Description |
| --- | --- |
| [9.1. BullMQ-Logger Service](9.1-bullmq-logger-service.md) | NestJS `LoggerService` for BullMQ `Job` objects with emoji state icons |
| [9.2. BullMQ-Logger Module](9.2-bullmq-logger-module.md) | Dynamic module (`registerAsync`) wiring the service to pino options |
| [9.3. BullMQ-Logger Schema](9.3-bullmq-logger-schema.md) | Joi schema for validating pino `LoggerOptions` (incl. `redact`) |

## Installation

```bash
npm install @triplef/bullmq-logger
```

## Peer Dependencies

```bash
npm install @nestjs/common bullmq joi pino pino-pretty
```
