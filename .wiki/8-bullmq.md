# 8. BullMQ: The @triplef/bullmq Library

A NestJS module for BullMQ integration with configuration types and validation schemas. `@triplef/bullmq` is published to npm as an **ESM-only** package.

> This library is **ESM-only** and does not support CommonJS. Your project must use ES modules.

## Modules

| Module | Description |
| --- | --- |
| [8.1. BullMQ Module](8.1-bullmq-module.md) | Dynamic module (`registerAsync`) registering BullMQ queues with a shared config factory |
| [8.2. BullMQ Config Schema](8.2-bullmq-config-schema.md) | Joi schema for validating the `BullMQConfig` (connection + default job options) |

## Installation

```bash
npm install @triplef/bullmq
```

## Peer Dependencies

```bash
npm install @nestjs/bullmq @nestjs/common bullmq ioredis joi
```
