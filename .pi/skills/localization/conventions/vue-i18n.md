# Vue I18n Message Convention

**Required when changing locale messages, identity keys, discovery, or fallback behavior.** Official references: [Vue I18n getting started](https://vue-i18n.intlify.dev/guide/essentials/started) and [fallback behavior](https://vue-i18n.intlify.dev/guide/essentials/fallback).

## Locale files and identity

Locale files live in `apps/dashboard/src/i18n/locales/`, one file per locale. Each exports a `LocaleMessages` object satisfying the shared schema.

Every locale object carries two identity keys at the top:

- `languageCode` is the Vue I18n locale code, such as `en`, `de`, or `fr`. The registry derives the i18n code from this value; the filename is irrelevant.
- `countryCode` is the ISO 3166-1 alpha-2 country code used for the flag, such as `us`, `de`, or `fr`. The registry derives the flag map from this value.

The English file therefore identifies English with the United States flag through its explicit identity values. Never replace either key with a bare `code`.

The rest of each object is the schema-shaped message tree.

## Registry and derived files

`locale-registry.ts` auto-discovers every locale file through `import.meta.glob`, validates each against the schema, and reads the identity keys to derive the locale code and flag.

`locale-codes.ts` and `messages.ts` derive from the registry. Do not edit the locale list, messages map, or flag map by hand. Adding a locale means adding its schema-valid locale file with correct identity values, not registering it in a second manual table.

## English and fallback

English is the source of truth and default locale. Required keys must be translated in every locale. An optional key may be omitted by a locale and fall back to English.

Optionality affects presence only. It never permits a different name or meaning in different locales. Fallback behavior must not be used as a reason to leave required translations absent.

Only English is used for component-behavior tests. Other locales receive structural schema validation rather than separate behavioral coverage.

## Names and technical identifiers

Never translate proper names, brands, products, companies, people, or technical identifiers that carry no translatable meaning or must match a backend contract. Do not create translation keys for them.

This includes API, zone, and endpoint names such as `serp_api` and `unlocker`; parameter labels such as `Blur Sigma` and `CLAHE`; protocol and acronym labels such as HTTP and SOCKET; file formats, units, and other invariant technical tokens.

## Prose examples

- A new French locale file declares its French language code and French country code at the top. No locale-list or flag-table edit follows.
- A German message may omit an optional informational key and fall back to English, but it may not give that key a different meaning.
- An endpoint identifier stays identical in every locale rather than receiving a translated label.

## Completion checklist

- Every locale file has correct explicit identity keys at the top.
- Discovery and derived files remain registry-owned.
- Required and optional presence follows the English fallback contract.
- Proper names and technical identifiers remain invariant and outside the message tree.
- Only English drives component-behavior tests.
