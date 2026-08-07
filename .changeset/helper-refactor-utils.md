---
"@triplef.io/server": patch
"@triplef.io/dashboard": patch
---

- `stripHtml` consolidated into a single `@/utils/strip-html.helper` (regex-based) and removed from the drop-down/exchange helpers
- `buildQueryParams` refactored to accept plain values instead of refs; conversation store gains a `patchConversation` helper replacing per-field setters
- Harness content-system prompt and shared prompt index cleaned up
