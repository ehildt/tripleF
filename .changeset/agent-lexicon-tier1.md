---
'@triplef/agent': patch
---

Two-tier encyclopedia — the encyclopedia now remembers every source touched, not just the fetched pages:

- **`EncyclopediaSelectInput.searchResults?`** — search results seen this turn, indexed as cheap Tier-1 snippet points (no page fetch, no link graph) so future turns can recall sources that were searched but never fetched.
- **`EncyclopediaSelectedChunk.sourceType?`** — `content` (fetched-document chunk) vs `result` (search-result snippet), so the harness can frame past-research context correctly (full text vs snippet).
- **FETCH-AFTER-SEARCH RULES** now instruct the model to fetch the most relevant result pages (not a fixed 1–3) and to prefer primary/readable sources over app stores, forums, and discussion threads.
