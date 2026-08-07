---
"@triplef.io/server": patch
"@triplef.io/dashboard": patch
---

- Type-safety refactor across the harness and AI SDK: typed `SendRequestOptions`, `PlayerControls`, `YouTubePlayerStateEvent`, and `BuildActivityLabelParams` replace inline anonymous types
- AI SDK params extracted into a dedicated `ai-sdk-params.types.ts`; harness actions (execute/interpret/respond/sanitize) and DLQ repository tightened with typed inputs
