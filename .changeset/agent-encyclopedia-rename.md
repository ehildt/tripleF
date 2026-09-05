---
'@triplef/agent': minor
---

Rename the retrieval-selection contract from "lexicon" to "encyclopedia" and add recall lifecycle flags:

- **`LexiconSelectInput` → `EncyclopediaSelectInput`**, **`LexiconSelectResult` → `EncyclopediaSelectResult`**, **`LexiconSourceDocument` → `EncyclopediaSourceDocument`**, **`LexiconSelectedChunk` → `EncyclopediaSelectedChunk`**, **`LexiconSearchResult` → `EncyclopediaSearchResult`** (breaking rename — the memory app's `/encyclopedia/select` endpoint matches).
- **`EncyclopediaSelectInput.model?`** — the turn's chat model, threaded to the classification job when the select call crosses the classify threshold (so classification runs without a dedicated `ENCYCLOPEDIA_CLASSIFY_MODEL`).
- **`MemoryPoint` lifecycle flags** — `isConsolidated`, `isReflected`, `isFriction`, `superseded`, `supersededBy`, so recall callers can annotate contested/stale records.
