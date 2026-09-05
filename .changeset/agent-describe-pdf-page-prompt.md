---
'@triplef/agent': minor
---

New harness prompt `buildDescribePdfPagePrompt` (`@triplef/agent/prompts`): one vision pass over a single rendered pdf page — layout description, verbatim transcription of all visible text, and one factual sentence per figure. Free-text by design (the output is chunked and embedded into the document's encyclopedia entry as-is); defines the explicit empty-page answer ("This page contains no readable content.") and contains no template placeholders.
