---
name: localization
description: Localization conventions for the dashboard. Use when adding, editing, or removing translation keys or locale files, working with Vue I18n or the Zod locale schema, running localization tests, or validating that locales stay synchronized with English.
---

# Localization Router

The dashboard UI is localized with Vue I18n. English is the source of truth, the default locale, and the only locale used for component-behavior tests. Every locale file is validated against the shared schema so missing and extra fields are caught.

Dashboard localization paths are rooted at `apps/dashboard/src/i18n/`.

## Route the task

| Task | Read |
| --- | --- |
| Add or translate messages, work with identity keys, fallback, or locale discovery | [Vue I18n](conventions/vue-i18n.md) |
| Change the locale-message schema or derived message type | [Zod schema](conventions/zod-schema.md) |
| Add, edit, remove, or audit keys after component changes | [Locale changes](conventions/locale-changes.md), plus the message or schema guide as applicable |
| Review renamed, repurposed, translated-identifier, manually maintained, or orphaned keys | [Key drift](anti-patterns/key-drift.md) |
| Run or review English-first and all-locale validation | [Schema validation](quality/schema-validation.md) |

## Always apply

- Add new keys to `en.ts` first and update the schema to the same shape before propagating translations.
- Every locale object begins with explicit `languageCode` and `countryCode` identity keys; never use a bare `code`.
- The schema owns message shape and its derived type. Never hand-maintain a parallel interface, locale list, or flag table.
- A key's name and meaning are permanent. Add a new key rather than renaming or repurposing an existing one.
- Required and optional describe presence only. Optional keys may fall back to English but have equally stable identity.
- Proper names and technical identifiers remain unchanged in every locale and do not receive translation keys.
- Every added, modified, or deleted component, composable, helper, or store is audited for referenced and dropped keys. Orphaned keys are removed.
- English must validate before other locales are updated; every locale must then validate against the schema.
- Creating or updating localization specs requires consent. Existing tests run after changes and are investigated rather than blindly trusted.

## Completion checklist

- English, schema, and every locale describe the same current message shape.
- Identity keys and derived registries remain correct without hand-maintained duplicates.
- No key was renamed, repurposed, orphaned, or created for an invariant technical identifier.
- English-first and all-locale validation completed in the required order.
