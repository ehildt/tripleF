---
'@triplef/agent': major
---

Initial release of the agent-domain library — the structured-output schemas, prompt builders, and model tools shared across the apps, with three subpath exports:

- `@triplef/agent/schemas` — the Zod schemas and `z.infer` types for intent classification, response templates, and memory extraction/consolidation/profile, plus the URL-trust and Zod-shape helpers (`formatZodShape`, `deriveSchemaKeys`), and the `EncyclopediaSelectInput`/`EncyclopediaSelectResult` contract for the ephemeral retrieval-selection endpoint.
- `@triplef/agent/prompts` — the harness and memory prompt builders, the snippet system, and the `buildStructuredPrompt` assembler that renders a schema's JSON shape into a prompt template. `buildMemoryProfilePrompt` now takes an optional `maxPayloadChars` valve (numCtx-derived, marked when it fires) instead of hardcoded `.slice(0, 1500)` cuts.
- `@triplef/agent/tools` — the search/tool factories (Serper, Bright Data, YouTube, web-fetch, image-variants, memory) with a decoupled `ToolDependencies` contract (structural `ToolLogger` and `ToolConfigSnapshot`, no `@nestjs/common` or app-config imports). Tools return full content (no silent `.slice` caps); `web-fetch` now extracts the main article as structural Markdown via `@mozilla/readability` + `linkedom` + `turndown` instead of a lossy regex strip.

Drift elimination: prompt JSON shapes and template key lists are now derived from their Zod schemas, so the prompt, the validator, and the dashboard types share one source of truth. The EODHD tools remain in the server (they are coupled to the stock-data domain).
