---
'@triplef/memory': minor
---

- **Lexicon persistence**: new `memory-lexicon` collection stores verbatim chunks of fetched sources (deterministic `url|contentHash|chunkIndex` ids, global scope with `partitionScope` provenance, `content`/`result` source types), plus a lexicon sweep job and read-through cache accounting.
- **Relink job**: LLM-based link enrichment — recomputes memory links, refines record tags via the new enrichment prompt, and adjudicates consolidation verdicts per category.
- **Cognition space**: `memory-cognition` service + insights endpoint (`POST /memory/cognition/insights`) and the `memory-cognition-forget` wipe.
- **Vocabulary endpoint**: `GET /memory/vocabulary` facets the partition's existing categories/tags so the write/extract prompts can reuse them.
- **Constellation node limit**: server-global `constellationNodeLimit` override (default 5000) caps the memory list query.
