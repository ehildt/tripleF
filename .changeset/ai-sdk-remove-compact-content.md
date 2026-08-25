---
'@triplef/ai-sdk': major
---

Remove `AiSdkService.compactContent` and the `CompactContentParams` type. The method was dead (no consumer) and its internal `.slice(0, 8000)` + generative-summary prompt is the silent-truncation anti-pattern the MEMLEX plan eliminates — retrieval selection now handles source-content budgeting extractively, never by summarizing.
