---
'@triplef/helpers': minor
---

- `retry-with-backoff`: added `AbortSignal` support, full jitter, `shouldRetry`, `onRetry`, and `backoffFactor` options. Defaults changed: `attempts` now defaults to 3 (was 1) and `jitter` defaults to `true`.
- `is-buffer-or-serialized`: fixed the `BufferLike` type — it no longer incorrectly includes `boolean` (now uses `ArrayBufferView`).
- Refactored `parse-llm-json`, `mask-api-key`, and `is-buffer-or-serialized` internals to one function per file (no public API change).
