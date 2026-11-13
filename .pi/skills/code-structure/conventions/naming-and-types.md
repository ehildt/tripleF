# Naming and Types Convention

**Required.** Use this document when naming files or symbols, choosing role suffixes, or declaring public types.

## Names express intent

Every file, function, type, and variable name must answer what it does on its own. Do not use abbreviations or vague containers such as `util`, `manager`, `handler`, or `types`. A reader should understand intent from the name without chasing a definition.

## Role suffixes

The suffix declares the module's role so readers know its contents before opening it.

Generic suffixes used everywhere are:

- `.helper.ts` for a pure function module with one exported function.
- `.types.ts` for hand-written type and interface declarations.
- `.constant.ts` for a themed group of constant values.
- `.model.ts` for the declaration of one domain model's shape.
- `.spec.ts` for a test file created or modified only with user consent.

Domain-specific suffixes are defined where that domain lives and remain consistent throughout its area. Do not drift between singular and plural forms such as `.constant.ts` and `.constants.ts`.

## Explicit types

Parameters and return types are always explicit at public boundaries. Do not use bare `any`, untyped returns, or inferred public shapes whose contract matters.

Hand-written exported types live in a co-located `.types.ts` file named after the producer they describe, with JSDoc on every field explaining what it carries and why. Consumers import that type rather than redeclaring a subset.

A types file has exactly one producer and sits beside that producer under the same name. Area-level orphan types files are drawers and are prohibited. When several same-area producers consume one shape, its home remains the producer owning the underlying concept; the others import it. A same-area import is not a reason to float the shape into an ownerless file.

Shapes mirroring an external system name the artifact they mirror and where it lives so drift remains traceable. Mirror only fields this consumer sends or reads and state when the mirror is partial. Import shapes already declared in a shared package rather than mirroring them again.

Export only types imported elsewhere. Nested members referenced only inside their own declaration file remain unexported; otherwise they create dead public surface.

Types local to one function live in that function's file. Parameter and return shapes are named above the function rather than written as anonymous inline object types. A named local shape carries intent and can be documented and tested; an exported shape follows the co-located producer rule instead.

Two exceptions are sanctioned:

- Schema-derived types stay beside the schema that produces them, preserving context and avoiding circular imports.
- A `.model.ts` file is itself the declaration file for its domain model's interfaces and shapes.

## Naming decision table

| Category | Pattern | Example |
| --- | --- | --- |
| Action function | Verb plus noun | `buildIntentSelectionPrompt` |
| Predicate | `is`, `has`, or `should` prefix | `isTrustedImageUrl` |
| Formatting helper | `format` plus what | `formatContextUsagePercent` |
| Calculation helper | `calc` plus what | `calcTokenPercent` |
| Helper file | Function name plus `.helper.ts` | `strip-html.helper.ts` |
| Types file | Source name plus `.types.ts` | `tool-factory.types.ts` |
| Constants file | Theme plus `.constant.ts` | `media-counts.constant.ts` |
| Model file | Domain noun plus `.model.ts` | `encyclopedia-select.model.ts` |

## Completion checklist

- Names communicate intent without abbreviations or vague drawers.
- Role suffixes are consistent and describe the file's actual content.
- Public parameters and returns are explicit and named.
- Exported types have one documented producer-owned home and real external consumers.
- Schema-derived and model-file exceptions remain with their declarations.
