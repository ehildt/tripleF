---
'@triplef/agent': minor
---

GraphRAG macro-taxonomy tiers (cluster → community → hub):

- `ExtractionSchema` gains an optional `community` field (turn-side and per-fact) — the plural sub-family tier one level below the category cluster (e.g. `survival-games` under `games`). Fact/turn docs now name the tiers explicitly (cluster = plural category, community = plural sub-family, hub = singular subject).
- `EncyclopediaClassifySchema` gains an optional `community` label; classification docs now describe topic as the singular hub tier.
- `memoryPartitionRememberSchema` gains optional `community` (≤60 chars) and `subject` (≤40 chars) fields — the remember tool routes a fact into the full hierarchy (category → community → subject), and the tool description + memory-write prompt teach pick-first reuse of existing labels.
