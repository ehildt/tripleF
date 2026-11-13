# Locale Change Workflow

**Required when adding, editing, removing, or auditing translation keys.** Read [Vue I18n](vue-i18n.md) for message behavior and [Zod schema](zod-schema.md) when the shape changes. Review [key drift](../anti-patterns/key-drift.md).

## Audit component changes

Every added, modified, or deleted Vue component, composable, helper, or store triggers a localization synchronization check.

Inspect the translation keys it references after the change. Add every new required key and remove every key whose last usage disappeared. A key orphaned by dropped usage is deleted rather than left as speculative message surface.

Pure helpers return translation keys and interpolation parameters while the caller performs translation. This keeps key usage visible at the caller and pure transformations independent of the translation runtime.

## Stable identity

A key's name and meaning are permanent because translation call sites and the schema depend on both. Never rename an existing key to improve wording or repurpose it for a new UI concept. Add a new key instead.

The rule applies equally to optional keys. Optionality controls whether a locale may omit the key, never what the key means.

## English-first sequence

After any localization change or component-driven key audit:

1. Edit `apps/dashboard/src/i18n/locales/en.ts` and update `locale-schema.ts` to exactly the same intended shape.
2. Run the existing localization test and validate the schema against English before touching other locales.
3. If English passes, update every other locale file: add missing required keys, remove dropped keys, preserve intentional optional presence, and translate new strings.
4. Run the localization test again so the schema is validated against every locale.

Do not propagate a broken English shape and then repair every locale repeatedly. English is the first validation gate.

## Message cleanup

When editing copy rather than adding a concept, preserve the existing key if its identity and meaning remain unchanged. When the meaning changes, use a new key and remove the old one only after confirming no remaining call site uses it.

Return only message fields consumers actually render. Dead fields can satisfy the schema while remaining unused UI surface.

## Prose examples

- A component that gains a confirmation action receives the new English key and schema field first, then translations after validation.
- A deleted panel's messages are removed only after searching all consumers; every locale and the schema drop keys whose last usage disappeared.
- A copy clarification that preserves meaning keeps its stable key. A new action with different semantics receives a new key.

## Completion checklist

- All touched components and logic units were audited for added and dropped key usage.
- English and schema changed first and validate before propagation.
- Every locale then matches intended required and optional presence.
- Existing keys were not renamed or repurposed, and orphans were removed.
- The final all-locale localization test passes.
