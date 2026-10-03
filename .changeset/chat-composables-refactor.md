---
'@triplef/dashboard': patch
---

Refactor the chat composables and helpers to one concern per file.

Split the ~570-line `useSubmit` god-composable into focused units: `usePromptDraft` (the prompt text plus its persisted draft, still reading the legacy `'api-fields'` field so existing drafts survive), `useHarnessRequest` (the harness POST, socket request tracking, and pending-attachment promotion), and a thin `useSubmit` that owns only the submit flow and the `isSubmitting` flag. All in-function store instantiations now happen once at setup.

Extract the remaining pure logic into one-function-per-file helpers with specs: `buildSubmitQueryParams`, `findSourceProviders`, `mergeSourceEndpoint`, `resolveSourceTargets`, `buildMirroredOverrides`, `isSourceToggle`, `sessionSourceEnabled`, and `collectProviderSources`. Move `listSearchSources` and its peers into the `helpers/` folder, and thin `useSearchEngineAvailability` down to the actions it actually performs.

Replace the scattered `Record<string, unknown>` shapes with named provider-override types (`ProviderOverrides`, `ProviderSessionOverrides`, `ProviderOverrideEntry`, `ProviderSourceEndpoint`, `SearchSourceToggle`).

Renames: `arguments_` → `promptDraft`, `persistArguments` → `persistPromptDraft`, `loading` → `isSubmitting`, `submitRest` → `submitCurrentPrompt`, `ensureConversation` → `ensureActiveConversation`, `buildConversation` → `buildPromptPayload`, `sendRequest` → `postHarnessRequest`. Adds co-located specs for the new composables and helpers.
