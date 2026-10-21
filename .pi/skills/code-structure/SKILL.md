---
name: code-structure
description: Framework- and library-agnostic module and file structure conventions — one function per file, explicit types in co-located .types.ts files, role-based file suffixes, co-location, and the no-barrel rule. Use when creating, moving, renaming, or splitting files anywhere in the monorepo (server, dashboard, packages), independent of Vue or NestJS specifics.
---

# Repository & Module Structure

This skill is the canonical home for structural rules that hold everywhere in the monorepo, regardless of framework or library. The framework-specific skills (`vue`, `nestjs`) add their own deltas and may state these rules in their domain form; where wording overlaps or conflicts, this file is canonical.

Rules state the convention and the reason. The prose-only rule applies here too: structure and shape are described in words, never as copy-paste samples.

## 1. Names express intent

Every file, function, type, and variable name must answer "what does this do?" on its own. No abbreviations, no vague containers such as `util`, `manager`, `handler`, or `types`. A reader should understand intent from the name alone, without chasing a definition.

## 2. One named exported function per file

Each named exported function lives in its own file. The file is named after the thing it defines — the function itself for `.helper.ts` modules, the primary domain noun for domain-role modules such as `.tool.ts` — kebab-cased, plus a role suffix that says what the module is (see Section 4).

A function file exports exactly one named function. Multi-function files become util drawers that hide where each function lives and make imports opaque.

Private, un-exported helpers stay inside their consumer file. They exist to serve exactly one caller; extracting them is how wrapper-indirection starts and how file count grows without information.

Prefer pure, stateless functions: take input, return output, no side effects, no external state. Side effects belong in the caller, or in a module whose role is the effect — never inside a function that also computes.

## 3. Constants group by theme

Constants live together in one `.constant.ts` file per concern, never one file per constant. A file per constant clutters the tree and gains nothing: constant values are data, not behavior, so the one-function-per-file rule does not apply to them.

A themed constants file is itself "one concern per file": a group of values that belong to the same domain and change together. It must not mix unrelated themes, and it must not become a drawer for every constant in the folder. Constants are not mixed into function files or model files; once a handful of values belong to a single concern, promote them to their own themed `.constant.ts`.

## 4. Role suffixes

The suffix declares the module's role. Readers see the suffix and know what the file is without opening it.

Generic suffixes, used everywhere:

- `.helper.ts` — a pure function module (one exported function).
- `.types.ts` — hand-written type and interface declarations.
- `.constant.ts` — a themed group of constant values.
- `.model.ts` — the declaration file for one domain model's shape(s).
- `.spec.ts` — a test file (created only with user consent; see Section 11).

Domain suffixes are defined where the domain lives and kept consistent within that area (in `packages`, for example, the prompt, schema, and tool roles use their own suffixes). Whatever the suffix set, it must be spelled consistently across a folder — no singular/plural drift such as `.constant.ts` beside `.constants.ts`.

## 5. Explicit types, co-located

Parameters and return types are always declared explicitly. No ambiguous types — no bare `any`, no untyped returns, no inferred shapes at a public boundary where the shape is part of the contract.

Hand-written exported types live in a co-located `.types.ts` file named after the source file they describe, with a JSDoc comment on every field explaining what it carries and why. The `.types.ts` is the single source of truth for that shape; consumers import the type from it rather than re-declaring a subset.

Types local to one function live in that function's file. A helper's parameter and return shapes are declared as named types above the function — never as anonymous object types written inline in the signature. An inline object type has no name, cannot carry a comment, and cannot be reused or tested against; naming it costs one line and keeps the signature readable before the body. When a shape is exported for other files, the `.types.ts` rule above applies instead.

Two sanctioned exceptions to "types in their own file":

- **Schema-derived types stay with their schema.** When a type is produced by a schema definition (an inferred type), splitting it from the schema invites circular imports and loses the co-located context. The schema file is the declaration file for its derived type.
- **A `.model.ts` file is itself the declaration file** for a domain model's interfaces; it exists precisely to hold that model's shape(s).

## 6. Co-location

A file lives next to its consumer unless it is shared across unrelated areas. Shared means imported from more than one unrelated area of the codebase. Single-consumer status is a fact to check, not an assumption: before relocating a file, list every importer — a file imported from a second, unrelated area is shared and stays put, because a consumer count guessed wrong breaks unrelated specs and produces review-time churn.

Helpers go in a `helpers/` folder parallel to their consumer. Resources shared across a whole area go in a `shared/` folder split by role. Only files used across the entire codebase belong in a top-level shared directory.

## 7. No barrel files

A barrel file is a re-export-only `index.ts` that aggregates sibling imports. Do not create them. Import directly from the file that defines the symbol — the path is the file.

Reasons: the import path should show where the symbol lives; renames and moves stay local to their real importers; barrels grow and leak internal symbols across boundaries; tree-shaking is unchanged either way.

The rule targets aggregation points, not filenames. A function or composable whose role is to gather and re-deal other units' APIs is a barrel in function form; the consumer must import the defining unit directly, never the re-dealing wrapper.

One exception: a published package's declared public entry points. When `package.json` exports map a subpath to a compiled entry, that entry file is the public surface and may re-export. Inside the package, interior code never imports through that entry; it imports the defining file directly. Importing through the declared entry is exactly what external consumers of the published package do — that is what the exception is for.

## 8. No wrapper functions

A function earns its name only if the call site cannot already see what it does. A wrapper that renames a field or delegates to a single call adds indirection without information.

Inline the call when no name is needed; name the binding (not a one-line function around it) when the value is reused; promote to a real `.helper.ts` predicate when it is a domain concept used in many places. A function that branches, supplies defaults, or has side effects is real logic and stays. Dependency injection that decouples a consumer from a store or service is not a wrapper — it earns its name by removing a coupling.

The same rule applies to a returned object. A return object never re-publishes another unit's members unchanged, verbatim or renamed; the consumer imports the defining unit directly. A returned member earns its place by being owned, derived, or composed into new behavior. The one sanctioned delegation shape: a privately-created per-caller service instance, whose wiring the producer must keep, is exposed under a single namespaced key rather than flattened into per-member re-exports.

At component level the rule reads the same: re-declaring another component's props under renamed keys, or forwarding its events unchanged, is the component form of the banned wrapper. A wrapper component earns its name only by adding its own chrome or behavior; a pure rename of the wrapped unit's API adds indirection without information.

The same discipline applies to audits and recommendations: options are judged by the design they serve, not by the number of files they touch — a zero-edit option carries the same burden of proof as a change. A local constant restating a shared constant value-for-value, or a validation guard that no call path can reach once the inputs are constrained, is the leftover of a half-done simplification: finish the consolidation (collapse the duplicate into the single source, delete the dead guard) instead of defending it as safety.

## 9. CSS classes are not an API

Styling hooks belong to the component that renders them. Never derive behavior from another unit's DOM — counting children by class name, sniffing structure, or branching on what a selector finds turns a cosmetic name into a hidden cross-component contract that breaks silently the next time the class is renamed. If a consumer needs to know something about what was rendered (how many, which kind), that information flows the sanctioned way — props in, events out, or an explicitly passed count — never through DOM inspection of slotted or child content.

## 10. Naming decision table

| Category            | Pattern                  | Example                     |
| ------------------- | ------------------------ | --------------------------- |
| Action function     | verb + noun              | `buildIntentSelectionPrompt` |
| Predicate           | `is`/`has`/`should` prefix | `isTrustedImageUrl`        |
| Formatting helper   | `format` + what          | `formatContextUsagePercent` |
| Calculation helper  | `calc` + what            | `calcTokenPercent`          |
| Helper file         | function name + `.helper.ts` | `strip-html.helper.ts`   |
| Types file          | source name + `.types.ts`   | `tool-factory.types.ts`   |
| Constants file      | theme + `.constant.ts`      | `media-counts.constant.ts` |
| Model file          | domain noun + `.model.ts`   | `encyclopedia-select.model.ts` |

## 11. Tests are a contract, not a mandate to create them

The `.spec.ts` and `.stories.ts` roles exist in the suffix taxonomy, but creating those files — like using browser automation — requires explicit user consent; the agent never generates them speculatively, and a change that would break an existing test is reported before either side is touched.

The semantics — consent gate, regression net, contract-not-infallible, report-before-fixing — live in one place: `APPEND_SYSTEM.md` § Tests, Stories & Browser Automation. This skill points to it rather than restating it.

## Checklist

- Every name answers "what does this do?" without context
- One named exported function per file, named after the function
- Helpers are pure and stateless; private locals stay in their consumer
- Constants grouped by theme in `.constant.ts` files, never mixed into function or model files
- Role suffixes spelled consistently across each folder
- Parameters and returns explicitly typed; named types in the function file — no inline anonymous object types in signatures
- Hand-written exported types in a co-located `.types.ts`; schema-derived types stay with their schema
- Files co-located with their consumer unless shared across unrelated areas
- No new barrel files; published package entry points are the only exception
- No wrapper functions
- No component re-declares another component's props under renamed keys or forwards its events unchanged
- No behavior derived from DOM class lookups — CSS classes are styling hooks, not an API
- No local constant restates a shared constant value-for-value — duplicates collapse to the single source
- No validation guard that no call path can reach once inputs are constrained at the source
- Recommendations argue from design merits, never from diff size — the zero-edit option carries the same burden of proof
- No function or composable returns another unit's members unchanged (no proxy barrels); a privately-created service instance is exposed once as a namespaced key
- Existing tests run after changes; a broken test is reported before fixing either code or test
