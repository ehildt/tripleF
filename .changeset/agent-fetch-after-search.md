---
"@triplef/agent": minor
---

Fetch tools now echo the requested `url` in their result (`webFetch`, `serperWebpageScrape`, `brightDataWebpageScrape`), so the harness lexicon can persist fetched content keyed by source URL instead of treating it as ephemeral. The `webFetch` description now encourages fetching the most relevant search results, and the intent-selection prompt gains FETCH-AFTER-SEARCH RULES instructing the model to fetch 1–3 result pages after a web search when full content would improve the answer.
