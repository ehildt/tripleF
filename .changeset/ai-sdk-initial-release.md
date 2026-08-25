---
'@triplef/ai-sdk': major
---

Initial release of the provider-agnostic AI SDK NestJS module:

- `AiSdkModule` — a dynamic module (`registerAsync`) wiring the service to caller-supplied `AiSdkConfig`.
- `AiSdkService` — streaming and generation clients (`streamChat`, `generateChat`, `compactContent`, `generateWithTools`) backed by the Vercel AI SDK. The provider is supplied by the app via `AiSdkConfig.createModel`, keeping the library provider-agnostic.
- `AiSdkConfigSchema` — an exported Joi schema for validating the serializable config fields.
- Message-conversion helpers (`toAiSdkMessages`, `toAiSdkMessage`, `toFilePart`, `detectImageMimeType`) and the shared message/params types.
