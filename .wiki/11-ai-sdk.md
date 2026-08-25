# 11. AI SDK: The @triplef/ai-sdk Library

A provider-agnostic NestJS module for the Vercel AI SDK — streaming and generation clients. `@triplef/ai-sdk` is published to npm as an **ESM-only** package.

> This library is **ESM-only** and does not support CommonJS. Your project must use ES modules.

## Modules

| Module | Description |
| --- | --- |
| [11.1. AI SDK Module](11.1-ai-sdk-module.md) | Dynamic module (`registerAsync`) wiring the service to `AiSdkConfig` |
| [11.2. AI SDK Service](11.2-ai-sdk-service.md) | Streaming/generation clients |
| [11.3. AI SDK Schema](11.3-ai-sdk-schema.md) | Joi schema for validating `AiSdkConfig` |

## Installation

```bash
npm install @triplef/ai-sdk
```

## Peer Dependencies

```bash
npm install @nestjs/common ai joi
```

The model provider (e.g. `ollama-ai-provider-v2`) is supplied by the consuming app via `AiSdkConfig.createModel`.
