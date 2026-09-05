---
'@triplef/agent': minor
---

Phase C of the MEMLEX plan — persistent `memory-encyclopedia` retrieval:

- **Remove `compactContent` from `ToolDependencies`** — it was dead (no tool called it) and its internal `.slice(0, 8000)` + generative summary is the anti-pattern this plan eliminates. Callers no longer need to wire it.
- **Extend the encyclopedia select contract** (`EncyclopediaSelectInput`/`EncyclopediaSelectResult`):
  - `EncyclopediaSelectInput.partitionScope?` — provenance recorded on stored chunks (the encyclopedia itself is global).
  - `EncyclopediaSelectResult.pastChunks?` — neighbor-expanded verbatim passages from previously persisted sources (the past-research lane).
  - `EncyclopediaSelectResult.reusedDocs?` / `storedDocs?` — read-through cache accounting.
