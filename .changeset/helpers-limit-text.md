---
'@triplef/helpers': minor
---

Add the `limit-text` subpath export: `limitText(text, maxChars?)` caps LLM-facing text without a silent cut — unchanged when it fits or when `maxChars` is undefined/<=0, otherwise a hard slice plus an explicit `[TRUNCATED — showing X of Y chars…]` marker so the model knows content is incomplete.
