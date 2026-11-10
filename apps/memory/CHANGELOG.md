# @triplef/memory

## 1.2.2

### Patch Changes

- 5a7ab35: Switch all first-party code to the PolyForm Strict License 1.0.0. Noncommercial use remains permitted for individuals, companies, and other organizations, but modification, redistribution, and commercial use require separate permission from the copyright holder.

  Update package license metadata, license badges, project descriptions, and contribution guidance to match. Third-party dependencies remain subject to their original licenses. Versions previously released under MIT or AGPL terms remain available under those terms.

- Updated dependencies [5a7ab35]
  - @triplef/agent@2.0.2
  - @triplef/ai-sdk@1.0.3
  - @triplef/bullmq-logger@1.3.3
  - @triplef/bullmq@1.1.7
  - @triplef/config-factory@1.2.3
  - @triplef/core-logger@1.0.3
  - @triplef/helpers@1.6.4
  - @triplef/ollama-api@1.0.0

## 1.2.1

### Patch Changes

- 565a256: Split monolithic module boundaries into focused services and helpers, tighten entry-point delegation, and align the affected dashboard and memory surfaces without changing their public behavior.
- Updated dependencies [565a256]
  - @triplef/agent@2.0.1

## 1.2.0

### Minor Changes

- b6e6476: Strict five-tier macro-taxonomy chain: cluster → community → hub → node → leaf (partition and encyclopedia lanes alike). The LLM contracts gain the named NODE tier below the hub (extraction, encyclopedia classify, remember tool, taxonomy probe) with all four chain labels mandatory — partial chains fail the schema and go through correction instead of entering the registry. Memory writes refuse incomplete chains after normalization; point payloads carry the new `node` field; `listLeaves` serves node (and tag) items. The dashboard drill follows the strict chain (hub view lists nodes, node/tag views show leaves) with a fifth harmony tint; the constellation renders node-tier aspect dots inside hub blobs (dot per distinct aspect, tinted in the topic color, registry meta attached) and leaf dots carry their node label. The preprocessing config is now strictly session-scoped server state: fetched on store construction (no boot idle-push), pushed immediately on change (no debounce), with the load echo guarded. NOTE: existing taxonomy data is incompatible — drop and rebuild.

### Patch Changes

- b6e6476: Judged-only memory writes (breaking).

  - `ExtractionSchema` is now verdict-first: a required `remember` boolean gates every record — `false` means the turn-side carries nothing worth storing and requires facts/tags/category/community to all be empty; `true` requires at least one fact. `preference` is removed from `FACT_KINDS` (subjective user data belongs to the cognition tier, never the objective partition).
  - `buildExtractionPrompt` rewritten around the gate: drop-bias replaces the keep-bias ("when in doubt, drop it"), one-off requests/tasks to the assistant are explicitly never facts, and gathered tool data / attached files become judging context sections.
  - Deleted `buildMemoryWritePrompt` / `MEMORY_WRITE_INSTRUCTIONS`: the classifier-gated write job is replaced by one judged extraction pipeline.
  - Deleted the `memory-partition-remember` / `memory-cognition-remember` agentic tools and their schemas, and removed both names from `MEMORY_TOOL_NAMES`, `TOOL_NAMES`, and `TOOL_DESCRIPTIONS` — writing is an automatic background judgment, never a classifier-picked tool.
  - `MEMORY_RULES` rewritten: the classifier's memory duties are recall/delete/forget/disclose only; the new AUTOMATIC WRITE rule explains that persisting happens without a tool after every turn, and UPDATE-LOOP now describes restatement-overwrite via the background pass.

  Server: the classifier-gated `memoryWrite` harness step is gone (deleted with its service); the `vectorize` step now runs the only turn-write path — one judged job per turn-side carrying the summarized non-memory tool results and attached file names as judging context; the assistant side is skipped on pure-chat turns (no gathered data, no uploads — parametric chat is not memory material). Removed the never-executed execute-wave remember tools, their deferral filters, and the obsolete sync `storeRecord`/`storeInsight` client methods.

  Memory: the `memory-write` BullMQ job and its tool-loop service are gone; the extract step is the single judged write path (verdict-first prompt, gathered/files context sections, verdict/facts consistency enforced in the parse helper with one correction retry).

- Updated dependencies [d4fc2a7]
- Updated dependencies [b6e6476]
- Updated dependencies [378fdb2]
- Updated dependencies [b6e6476]
  - @triplef/agent@2.0.0

## 1.1.0

### Minor Changes

- ec0d0a5: - **Encyclopedia persistence**: new `memory-encyclopedia` collection stores verbatim chunks of fetched sources (deterministic `url|contentHash|chunkIndex` ids, global scope with `partitionScope` provenance, `content`/`result` source types), plus a encyclopedia sweep job and read-through cache accounting.
  - **Relink job**: LLM-based link enrichment — recomputes memory links, refines record tags via the new enrichment prompt, and adjudicates consolidation verdicts per category.
  - **Cognition space**: `memory-cognition` service + insights endpoint (`POST /memory/cognition/insights`) and the `memory-cognition-forget` wipe.
  - **Vocabulary endpoint**: `GET /memory/vocabulary` facets the partition's existing categories/tags so the write/extract prompts can reuse them.
  - **Constellation node limit**: server-global `constellationNodeLimit` override (default 5000) caps the memory list query.
- bbe382d: Migrated both apps from their local `pino-logger` modules to the published `@triplef/core-logger` package:

  - Replaced `PinoLoggerService`/`PinoLoggerModule` with `CoreLoggerService`/`CoreLoggerModule.registerAsync`, wired through a new app-level `CoreLoggerConfigService` (`@CacheReturnValue(CoreLoggerSchema)`).
  - Logging now renders the NestJS context inline as `[Context] message` (via the pino-pretty `messageFormat` + `ignore: 'pid,hostname,context'`), preserves error stacks, and supports `setLogLevels` and per-call `onLog` hooks.
  - Bumped `@triplef/config-factory` to `^1.1.4` (root export).
  - Removed the unused `json5` dependency.

### Patch Changes

- Updated dependencies [ec0d0a5]
- Updated dependencies [3fc42b2]
- Updated dependencies [3fc42b2]
- Updated dependencies [6d288c6]
- Updated dependencies [3fc42b2]
- Updated dependencies [3fc42b2]
- Updated dependencies [3fc42b2]
- Updated dependencies [ec0d0a5]
- Updated dependencies [3fc42b2]
- Updated dependencies [ec0d0a5]
- Updated dependencies [ec0d0a5]
- Updated dependencies [ec0d0a5]
- Updated dependencies [ec0d0a5]
- Updated dependencies [ec0d0a5]
- Updated dependencies [4a03c4d]
- Updated dependencies [3fc42b2]
- Updated dependencies [3fc42b2]
- Updated dependencies [3fc42b2]
- Updated dependencies [ec0d0a5]
- Updated dependencies [3fc42b2]
- Updated dependencies [ec0d0a5]
- Updated dependencies [3fc42b2]
- Updated dependencies [ec0d0a5]
- Updated dependencies [6d288c6]
- Updated dependencies [13383bb]
- Updated dependencies [ec0d0a5]
- Updated dependencies [be7ff5f]
- Updated dependencies [36adb77]
- Updated dependencies [4a03c4d]
- Updated dependencies [36adb77]
  - @triplef/agent@1.0.0
  - @triplef/ai-sdk@1.0.0
  - @triplef/bullmq-logger@1.3.0
  - @triplef/core-logger@1.0.0
  - @triplef/helpers@1.6.0
  - @triplef/config-factory@1.2.0
