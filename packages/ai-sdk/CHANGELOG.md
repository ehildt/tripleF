# @triplef/ai-sdk

## 1.0.0

### Major Changes

- ec0d0a5: Initial release of the provider-agnostic AI SDK NestJS module:

  - `AiSdkModule` — a dynamic module (`registerAsync`) wiring the service to caller-supplied `AiSdkConfig`.
  - `AiSdkService` — streaming and generation clients (`streamChat`, `generateChat`, `compactContent`, `generateWithTools`) backed by the Vercel AI SDK. The provider is supplied by the app via `AiSdkConfig.createModel`, keeping the library provider-agnostic.
  - `AiSdkConfigSchema` — an exported Joi schema for validating the serializable config fields.
  - Message-conversion helpers (`toAiSdkMessages`, `toAiSdkMessage`, `toFilePart`, `detectImageMimeType`) and the shared message/params types.

- ec0d0a5: Remove `AiSdkService.compactContent` and the `CompactContentParams` type. The method was dead (no consumer) and its internal `.slice(0, 8000)` + generative-summary prompt is the silent-truncation anti-pattern the MEMLEX plan eliminates — retrieval selection now handles source-content budgeting extractively, never by summarizing.

### Patch Changes

- ec0d0a5: Bump the `ai` peer dependency to `^7.0.83` to align with the server's `ai@7.0.83` (and the `@triplef/agent` peer bump), keeping the `Tool`/`ToolSet` types from `@ai-sdk/provider-utils@5.0.32` consistent across the workspace.
- 3fc42b2: Chained tool waves no longer force `toolChoice: 'required'` past the first step.

  - **Fix:** `generateWithTools` with `maxSteps > 1` now uses `prepareStep` per-step: step 1 stays `required` (the mandatory classifier-picked wave must fire), follow-up steps switch to `auto` so the deep-dive chain can finalize with a plain answer. Previously `required` persisted across the whole chain, throwing `ToolChoiceViolationError` whenever the model answered in text after gathering evidence — discarding content and burning a retry.
  - **Precedence:** an explicit caller `toolChoice` still wins outright; single-step calls are unchanged.

- 3fc42b2: Chained tool waves no longer re-send reasoning parts to reasoning-incapable providers.

  - **Fix:** `generateWithTools` follow-up steps now run the accumulated transcript through the AI SDK's own `pruneMessages({ reasoning: 'all' })` via the `prepareStep` messages override. Thinking models emit reasoning parts on earlier steps which the SDK kept re-sending inside the chain — providers like Ollama's responses API warn and drop them per call. Pruned at the step boundary, reasoning stays available on the result/display side but never rides the wire.
  - Single-step calls and `generateChat` are unchanged.
