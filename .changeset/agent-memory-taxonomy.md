---
'@triplef/agent': minor
---

Memory taxonomy and enrichment:

- `ExtractionSchema` gains an optional `category` field — one broad **plural family noun** (e.g. `stocks`, `games`) that groups the narrow tags into a topic family for the constellation's community tier and the relink job's per-category passes.
- `buildExtractionPrompt` and `buildMemoryWritePrompt` now accept the partition's existing category/tag vocabulary and inject a reuse-first vocabulary section, so the model extends the taxonomy instead of minting near-duplicates.
- New `MemoryEnrichmentSchema` + `buildEnrichPrompt` for the relink job's optional tag-refinement step (2–6 stable lowercase topic labels per record).
