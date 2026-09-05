---
'@triplef/ai-sdk': patch
---

Chained tool waves no longer force `toolChoice: 'required'` past the first step.

- **Fix:** `generateWithTools` with `maxSteps > 1` now uses `prepareStep` per-step: step 1 stays `required` (the mandatory classifier-picked wave must fire), follow-up steps switch to `auto` so the deep-dive chain can finalize with a plain answer. Previously `required` persisted across the whole chain, throwing `ToolChoiceViolationError` whenever the model answered in text after gathering evidence — discarding content and burning a retry.
- **Precedence:** an explicit caller `toolChoice` still wins outright; single-step calls are unchanged.
