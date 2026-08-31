# 12. Agent: The @triplef/agent Library

The shared **agent domain** package: the structured-output schemas, prompt builders, and model tools that both apps consume. `@triplef/agent` is published to npm as an **ESM-only** package.

> This library is **ESM-only** and does not support CommonJS. Your project must use ES modules.

The package exists so the contract between the model and the system lives in exactly one place: the **server** harness uses its intent schema, response schemas, system prompts, and tool factories on the request path, and the **memory app** uses its memory prompts, consolidation/cognition schemas, and clamp bounds in the background pipeline — both sides always agree on shape.

## Exports (subpath modules)

| Subpath | Contents |
| --- | --- |
| `@triplef/agent/schemas` | [12.1](12.1-schemas.md) — intent + response JSON schemas (Zod), memory/consolidation/cognition models + clamps, tool registry (`TOOL_NAMES`, `BROWSER_TOOL_NAMES`, `MEMORY_TOOL_NAMES`, `ProviderConfig`), URL-trust constants/helpers, Zod formatting helpers |
| `@triplef/agent/prompts` | [12.2](12.2-prompts.md) — system prompts, per-variant instructions, snippet-composed presets, memory job prompts, shared prompt fragments |
| `@triplef/agent/tools` | [12.3](12.3-tools.md) — dependency-injected tool factories: Serper, Bright Data, YouTube, web-fetch, image-variants, memory tools |

## Installation

```bash
npm install @triplef/agent
```

Peer dependencies:

```bash
npm install ai zod
```

## Design notes

- **Pure factories, injected dependencies** — a tool factory never knows *how* its provider is reached. The apps inject clients: the server injects HTTP/provider clients for search tools and the `memory-client` (HTTP to the memory app) for the memory tools' scopes (see `MemoryToolScope` — partition/cognition binding threaded per request).
- **Zod is the contract** — every model-facing schema lives here as Zod, re-used verbatim by the harness response validators and the memory job parsers.
- **Clamps travel with the schema** — bounds like `clampCognitionLimit` / `clampEpisodeProbeLimit` are exported from `schemas`, so the memory-overrides service and the DTOs share the same envelope (see **1.6** §9).

## Related

- The harness that drives these tools: **1.2**
- The memory jobs that parse these schemas: **1.7**
