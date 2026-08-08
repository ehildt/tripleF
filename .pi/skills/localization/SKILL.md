---
name: localization
description: Localization (i18n) conventions for the dashboard. Use when adding, editing, or removing translation keys or locale files, running the localization schema/tests, or validating that all locales stay in sync with English.
---

# Localization (i18n) Conventions

The dashboard's UI chrome is localized with `vue-i18n`. English (`en`) is the
**source of truth** and the only locale used for testing. Every locale file is
validated against a shared **Zod schema** so missing or extra fields are caught
at compile/test time.

## Where things live

- `src/i18n/locales/*.ts` — one file per locale. Each file exports a
  `LocaleMessages` object that satisfies the schema.
- `src/i18n/locale-schema.ts` — the Zod schema + the derived `LocaleMessages`
  type (`z.infer`). This is the single source of truth for the shape.
- `src/i18n/locale-registry.ts` — auto-discovers every file in `locales/`
  via `import.meta.glob`, validates each against the schema, and reads the
  `languageCode` / `countryCode` keys to derive the locale code and flag.
- `src/i18n/locale-codes.ts` / `messages.ts` — derived from the registry; do
  **not** edit the locale list by hand.

## Key naming (be explicit)

Every locale file carries two identity keys at the top of the object. Use the
full, explicit names — never a bare `code`:

- **`languageCode`** — the i18n locale code used by `vue-i18n` (e.g. `'en'`,
  `'de'`, `'fr'`). The registry derives the i18n code from this key; the
  filename is irrelevant.
- **`countryCode`** — the ISO 3166-1 alpha-2 country code used for the flag
  (e.g. `'us'`, `'de'`, `'fr'`). The registry derives the flag map from this
  key, so there is no separate hand-maintained flag table.

Example:

```ts
export const en: LocaleMessages = {
  languageCode: 'en',
  countryCode: 'us',
  app: { /* … */ },
  // …
};
```

## Core rules

1. **English is the source of truth.** All new keys are added to `en.ts` first.
   `en` is the default locale and the one used in tests.
2. **Every locale file has `languageCode` and `countryCode` keys.**
   `languageCode` holds the i18n locale code (e.g. `'en'`); `countryCode`
   holds the flag country code (e.g. `'us'`). The registry derives both the
   locale list and the flag map from these keys — the filename is irrelevant.
3. **The type is derived from the Zod schema.** Extend the schema (in
   `locale-schema.ts`) when adding a key; the `LocaleMessages` type updates
   automatically. Do not hand-edit a separate interface.
4. **Keys must be stable.** A key's **name and meaning** are permanent. Never
   rename or repurpose a key — call sites (`t('common.copy')`) and the schema
   depend on the name, and the meaning must be identical everywhere the key
   appears. Add a new key instead of changing an existing one. This applies to
   optional keys too: optionality only affects *presence*, never *identity*.
5. **Optional vs required.** This is about *presence*, not *meaning*. A
   required key must be translated in every locale; an optional key may be
   omitted by a locale and fall back to English. Both required and optional
   keys are equally **stable** — an optional key still has a fixed name and
   meaning wherever it appears.
6. **Never translate names or technical identifiers.** Proper names (brands,
   products, companies, people) and technical identifiers stay **as-is** in
   every locale — do not create keys for them. This includes API/zone/endpoint
   names (`serp_api`, `unlocker`), parameter names (`Blur Sigma`, `CLAHE`),
   protocol/acronym labels (`HTTP`, `SOCKET`), file formats, units, and other
   technical tokens that must match a backend contract or carry no
   translatable meaning.
7. **Component changes trigger a localization sync check.** Every added,
   modified, or deleted component (`.vue`, composable, helper, store) must be
   audited for the translation keys it touches: add any new keys it references,
   and **remove any key it no longer uses** — a key orphaned by a dropped usage
   must be deleted, not left behind. This keeps `en.ts` and the schema exactly
   in sync with what the code actually renders.

## Workflow after any localization change

0. **Component changes** (added/modified/deleted) trigger the same check as key
   changes: add keys the new code references and remove keys it dropped, then
   continue from step 1.

1. **Edit `en.ts`** (add/remove/change keys) and update the schema in
   `locale-schema.ts` to match.
2. **Run the localization test** and validate the schema against English:
   - `cd dashboard && pnpm test` (or the localization-specific spec)
   - The schema must pass against `en.ts` before anything else.
3. **If English passes**, update every other locale file to match the new
   shape (add missing keys, remove dropped keys, translate new strings).
4. **Verify all locales** by running the schema against each one — the
   localization test iterates every file in `locales/` and asserts it parses
   against the schema. All must pass.

## Testing

- The localization spec validates **every** locale file against the Zod schema,
  so a missing key in any language fails the suite.
- Always run the localization test after touching `locales/`, `locale-schema.ts`,
  `locale-registry.ts`, `locale-codes.ts`, or `messages.ts`.
- `en` is the only locale used for unit-testing component behavior; other
  locales are validated structurally (schema) but not exercised in tests.

## Checklist

- [ ] Any added/modified/deleted component was audited: keys it references exist, and keys it dropped were removed
- [ ] New keys added to `en.ts` first, then propagated to all other locales
- [ ] Schema in `locale-schema.ts` updated to match the new shape
- [ ] `languageCode` and `countryCode` keys present and correct in every locale file
- [ ] No existing keys renamed or repurposed
- [ ] Localization test passes against `en.ts`
- [ ] All other locales updated and pass the schema in the test suite
