---
'@triplef/agent': patch
---

Bump the `ai` peer dependency to `^7.0.83` to align the `Tool`/`ToolSet` types with the server's `ai@7.0.83`. The previous `^7.0.79` resolved to `@ai-sdk/provider-utils@5.0.30`, whose `Tool` type is incompatible with `5.0.32` (used by `ai@7.0.83`), breaking the server's type-check when it passed the agent's tool factories to `withSummary`.
