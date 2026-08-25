---
'@triplef/agent': patch
---

Lane-qualified memory tools and an unbounded episode probe limit.

- **Tool renames (breaking):** `memoryRemember` → `memory-partition-remember`, `memoryRecall` → `memory-partition-recall`, and `memoryDelete` is split into `memory-partition-delete` (verbatim fact delete) and `memory-cognition-forget` (cognition-space wipe). `MEMORY_TOOL_NAMES` and `TOOL_NAMES` now carry the five lane-qualified names.
- **New tool:** `memory-cognition-remember` stores one derived insight into the AI's cognition space (`{text, path?}`), so the model can route its own understanding of the user separately from stated facts.
- **`EPISODE_PROBE_LIMIT_MAX` removed** and `EPISODE_PROBE_LIMIT_MIN` lowered to `0` — the episode probe limit is now unbounded above zero (`clampEpisodeProbeLimit` floors at 0; 0 disables the probe).
- **Prompts:** the intent-selection MEMORY RULES, the memory-write job, and the vectorize extraction prompt now teach the partition/cognition lane split and are more eager about durable user data.
