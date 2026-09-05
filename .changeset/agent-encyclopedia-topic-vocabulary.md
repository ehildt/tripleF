---
'@triplef/agent': minor
---

Encyclopedia classification prompt gains a known-topics vocabulary: `buildEncyclopediaClassifyPrompt(knownCategories, knownTopics)` injects the encyclopedia's existing topic labels as a reuse-first hint so tier-1 snippet classification extends the taxonomy instead of minting a variant per source (`nte` vs. `neverness to everness`). The topic rule now also bars domains and site names explicitly.
