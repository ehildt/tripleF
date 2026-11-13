# Localization Schema Validation

**Required after touching locale files, the locale schema, registry, derived locale codes, or messages.**

## Existing localization test

The existing localization spec validates every file in `apps/dashboard/src/i18n/locales/` against the shared Zod schema. A missing required key or unexpected field in any language fails the suite.

Run from the actual dashboard workspace:

- `cd apps/dashboard && pnpm test` runs the dashboard Vitest suite.
- When available, run the localization-specific existing spec for a focused feedback loop, followed by the relevant suite as required.

Creating or updating a spec requires explicit user consent. Do not add localization coverage speculatively. Existing tests are a regression net and contract, not infallible proof; investigate failures and report a breaking change before modifying either implementation or test.

## Required order

1. Update English and the schema to the same intended shape.
2. Validate English before changing other locales.
3. After English passes, update every other locale's required and optional presence and translations.
4. Run validation across every locale and confirm all parse against the schema.

Do not claim all-locale validation from an English-only result. The two gates are separate and sequential.

## Behavioral-test boundary

English is the only locale used for component-behavior tests. Other locales are validated structurally through the schema but are not exercised as separate component-behavior environments.

Schema validation proves shape, not translation quality or rendered layout. Review translated copy for meaning and inspect rendered behavior separately when required; do not claim visual verification that was not performed.

## Completion checklist

- The existing localization test or focused spec ran from `apps/dashboard`.
- English passed before other locales were edited.
- Every locale then passed schema validation.
- Required and optional presence and removed fields match the intended shape.
- No new spec was created without consent.
- Translation quality and rendered layout are not claimed from schema success alone.
