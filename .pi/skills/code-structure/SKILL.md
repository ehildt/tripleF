---
name: code-structure
description: Framework- and library-agnostic module and file structure conventions — one function per file, explicit types in co-located .types.ts files, role-based file suffixes, co-location, and the no-barrel rule. Use when creating, moving, renaming, or splitting files anywhere in the monorepo, independent of framework specifics.
---

# Repository Structure Router

Use this skill whenever files, functions, exported types, constants, or ownership boundaries are created, moved, renamed, or split. It is framework-agnostic and independently applicable.

## Route the task

| Task | Read |
| --- | --- |
| Name a symbol or file; choose a role suffix; declare parameter, return, or exported types | [Naming and types](conventions/naming-and-types.md) |
| Create or move a function, constants file, or shared resource; determine consumer scope | [File placement](conventions/file-placement.md) |
| Evaluate a wrapper, barrel, proxy return, component relay, or DOM-derived behavior | [Coupling and indirection](anti-patterns/coupling-and-indirection.md) |
| Review ownership and purity after implementation | [Placement audit](quality/placement-audit.md) |

Load every document applicable to the approved scope. A move can require naming, placement, anti-pattern review, and the final audit together.

## Always apply

- Names answer what the symbol does without contextual guesswork; vague drawers and abbreviations are refused.
- Each named exported function has its own file. Private helpers remain with their sole consumer.
- Constants group by one theme per concern, never one file per constant and never inside unrelated behavior files.
- Role suffixes declare file roles and remain consistent within a folder.
- Parameters and public returns are explicit. Exported hand-written types have one producer-owned, co-located home.
- Files live next to their consumers unless actual unrelated importers prove that they are shared.
- No barrel files, rename-only wrappers, proxy returns, or compatibility forwarders.
- Repeated keyed reads use an owner-level getter; single-use operations stay inline.
- CSS classes are styling hooks, never a behavioral API.
- Recommendations are based on design merit rather than edit count.
- After implementation and before other quality gates, complete the placement and purity audit.
- Creating or updating tests and stories requires explicit user consent. Existing tests are a regression net and a contract, not infallible proof; report a breaking change before modifying either implementation or test.

## Completion checklist

- Every touched symbol has an intentional name, role, owner, and consumer-scoped location.
- Public types follow their producer and have no dead exports or anonymous public shapes.
- No new indirection, barrel, stale path, or duplicated source of truth remains.
- The placement audit covers touched units, private functions, siblings in scope, and immediate consumers.
