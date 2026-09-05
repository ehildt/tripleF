---
'@triplef/ai-sdk': patch
---

Chained tool waves no longer re-send reasoning parts to reasoning-incapable providers.

- **Fix:** `generateWithTools` follow-up steps now run the accumulated transcript through the AI SDK's own `pruneMessages({ reasoning: 'all' })` via the `prepareStep` messages override. Thinking models emit reasoning parts on earlier steps which the SDK kept re-sending inside the chain — providers like Ollama's responses API warn and drop them per call. Pruned at the step boundary, reasoning stays available on the result/display side but never rides the wire.
- Single-step calls and `generateChat` are unchanged.
