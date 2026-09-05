---
'@triplef/agent': minor
---

Agentic encyclopedia tools: the execute wave learns to consult and deep-dive the knowledge base on its own.

- **New tools:** `encyclopedia-search` (semantic search over the knowledge base — verbatim passages of fetched pages and uploaded documents with source url, chunk coordinates, and fetch date; optionally scoped to one document url or domain) and `encyclopedia-read` (windowed full-content read of one stored document by url, chunked continuation via `startChunk` — the deep-dive loop). Both render plain provenance text results with citeable urls, mirroring the memory tools.
- **New registry constant:** `ENCYCLOPEDIA_TOOL_NAMES` — the always-on wave tools offered whenever the memory feature is enabled; deliberately outside `TOOL_NAMES`/`MEMORY_TOOL_NAMES` (never classifier-picked).
- **New wire contracts:** `EncyclopediaSearchInput`/`EncyclopediaSearchHit` and `EncyclopediaDocumentInput`/`EncyclopediaDocumentResult` (shared by the memory app's endpoints and the server harness), mirroring `encyclopedia-select.model.ts`.
- **New prompt builder:** `buildCognitionProfileSection` — the cognition profile block for the intent classifier's memory probe, next to the fact probe and episode probe.
