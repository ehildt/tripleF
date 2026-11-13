# Zod Locale Schema Convention

**Required when changing message shape or validation.** Official references: [Zod basic usage](https://zod.dev/basics) and [schema definitions](https://zod.dev/api).

## Single source of shape

`apps/dashboard/src/i18n/locale-schema.ts` owns the Zod schema and the derived `LocaleMessages` type through `z.infer`. It is the single source of truth for locale-message shape.

Extend the schema whenever adding, removing, or changing a message key. The derived type updates automatically. Never hand-edit a separate interface or create a second declaration that mirrors the schema.

Because the type is produced by the schema, it stays beside that schema rather than moving into an ownerless types drawer.

## Required and optional fields

A required key must be present and translated in every locale. An optional key can be omitted by a locale so English fallback supplies it.

Required and optional describe presence, not identity or meaning. Both kinds of key have permanent names and semantics wherever they appear. Making a key optional does not authorize repurposing it or giving different locales different contracts.

## Validation contract

The localization spec parses every file in `locales/` against the schema. Missing required keys and unexpected extra fields therefore fail validation rather than drifting silently.

English is validated first after a change. Only after English passes are other locale files updated to the new shape and validated as a complete set. The detailed order is in [locale changes](locale-changes.md) and [schema validation](../quality/schema-validation.md).

A schema change must describe actual rendered usage. Fields orphaned by removed component behavior are deleted from the schema and locales rather than retained speculatively.

## Prose examples

- Adding a new required confirmation message changes English and the schema first, then adds the translated field to every other locale after English validates.
- Making a help field optional permits omission and English fallback but does not permit changing what its existing key means.
- Removing the last usage of a message removes it from English, the schema, and every locale rather than leaving a valid but dead field.

## Completion checklist

- `locale-schema.ts` is the only message-shape owner.
- `LocaleMessages` remains schema-derived with no parallel interface.
- Required and optional presence matches actual fallback intent without changing key identity.
- English validates before propagation and every locale validates afterward.
- Removed usage produces matching schema and locale cleanup.
