---
'@triplef/agent': minor
---

Phase C of the MEMLEX plan — persistent `memory-lexicon` retrieval:

- **Remove `compactContent` from `ToolDependencies`** — it was dead (no tool called it) and its internal `.slice(0, 8000)` + generative summary is the anti-pattern this plan eliminates. Callers no longer need to wire it.
- **Extend the lexicon select contract** (`LexiconSelectInput`/`LexiconSelectResult`):
  - `LexiconSelectInput.partitionScope?` — provenance recorded on stored chunks (the lexicon itself is global).
  - `LexiconSelectResult.pastChunks?` — neighbor-expanded verbatim passages from previously persisted sources (the past-research lane).
  - `LexiconSelectResult.reusedDocs?` / `storedDocs?` — read-through cache accounting.
