# Localization Key-Drift Anti-Patterns

Read this document whenever changing messages, schemas, locale discovery, or component key usage.

## Renamed or repurposed keys

**Banned:** renaming an existing translation key for style, reusing it for a different action or meaning, or treating an optional key as exempt from identity stability.

**Why:** call sites and schema shape depend on stable identity, and different meanings across locales make fallback unreliable.

**Required alternative:** retain the key for copy edits with unchanged meaning. Add a new key for a new concept and remove the old key only after all usages are gone.

## Bare or duplicated locale identity

**Banned:** using a bare `code`, deriving locale identity from the filename, or maintaining a separate hand-written locale or flag table.

**Why:** duplicate identity sources drift and can associate the wrong messages or flag with a locale.

**Required alternative:** every locale object declares `languageCode` and `countryCode` at the top, and the registry derives all locale and flag collections.

## Parallel message-shape declarations

**Banned:** hand-maintaining an interface or second schema alongside the Zod locale schema.

**Why:** parallel declarations drift without providing an independent source of truth.

**Required alternative:** extend `locale-schema.ts` and use its derived `LocaleMessages` type.

## Translating invariant identifiers

**Banned:** translating proper names, backend-contract identifiers, parameter names, protocol acronyms, file formats, or units, or adding message keys for values that must remain unchanged.

**Why:** translation can break contract matching or falsely suggest that a technical identifier has localized semantics.

**Required alternative:** keep those tokens as-is in every locale and outside the translatable message tree.

## Orphaned and prematurely propagated keys

**Banned:** leaving keys whose last component usage was deleted, or updating every locale before English and the schema validate.

**Why:** dead fields accumulate as valid-looking surface, while propagating an invalid English shape multiplies rework and drift.

**Required alternative:** audit added, modified, and deleted units; remove dropped keys everywhere; validate English first, then propagate and validate all locales.

## Review checklist

- No key name or meaning changed and optionality affected presence only.
- Locale identity has one registry-driven source.
- Message shape has one schema-derived source.
- Technical identifiers and proper names remain invariant.
- No orphaned key or invalid English shape was propagated.
