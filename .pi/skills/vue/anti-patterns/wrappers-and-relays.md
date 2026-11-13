# Wrapper and Relay Anti-Patterns

Read this document before extracting functions or composables, changing component composition, or adding aggregation points. Generic wrapper, returned-object, and barrel rules are canonical in [code-structure](../../code-structure/SKILL.md); this document preserves their Vue-specific applications and exceptions.

## Rename-only functions add no abstraction

**Banned:** a function that only renames a field, delegates to one call, or coerces and reshapes a value before one delegated call. A local function that only assigns a model update is also redundant when direct model binding expresses the same operation.

**Why:** the reader must open another file or jump to another symbol but learns nothing the call site did not already say. The wrapper hides the actual operation behind a new verb without adding information.

**Required alternative:** choose according to the useful boundary:

1. Inline the operation when its existing name is already clear.
2. Name the resulting binding—a set, map, computed value, or ref—when reused domain intent needs a name. In particular, a wrapper repeated three or more times in one file with the same argument shape should become a named result rather than remain a function alias.
3. Promote a cross-file domain predicate or transformation to one substantive helper with its required approved spec.

**Legitimate exceptions:** branching, default values, side effects owned by the correct unit, type narrowing, and domain meaning used across consumers are real behavior. A composable factory that creates a per-key computed value owns reactive state and is not a synonym. A one-line domain helper with its own file and approved spec can likewise earn its name.

Dependency injection that imports a store or composable and supplies only the derived flat props a leaf needs is also legitimate: it removes coupling rather than renaming a call. Owner-level repeated keyed getters are legitimate APIs under code-structure and are not wrappers.

## Components never wire composables through relays

**Banned:** a component destructures one composable's outputs and forwards them as arguments into a sibling composable, or passes singleton stores, services, and shared state through parameters that could be resolved by the receiving unit.

**Why:** dependency choreography disappears into component setup, and every consumer must reproduce the same wiring.

**Required alternative:** composables import and call their own dependencies. Components call only the composables from which their templates bind. Parameters remain for values that genuinely vary per call site.

## Returned objects must not be proxy barrels

**Banned:** republishing an imported composable, store, or service facade's members in a composable return, whether verbatim, renamed, flattened, or exposed as store-method aliases.

**Why:** consumers no longer see where symbols are defined, and every source API change must be mirrored through the proxy. Renaming a delegated member adds indirection rather than new behavior.

**Required alternative:** consumers import the source unit directly. A return member earns its place only when the composable owns it, derives it, or combines dependencies into behavior with new meaning, such as an act-then-close or select-then-open workflow.

**Exception:** when a composable privately creates a per-caller service instance whose own logic must remain wired to that exact instance, expose the instance once under a namespaced delegation key. Consumers reach into that object; its members are not flattened into individual re-exports.

Component-level prop renaming and unchanged event forwarding are the same anti-pattern and are covered by [component boundaries](component-boundaries.md).

## No barrel files or compatibility aggregation

**Banned:** adding a re-export-only `index.ts` file, registering new files in an existing barrel, or leaving a compatibility forwarder after moving a unit.

**Why:** direct paths communicate ownership and keep moves and renames local. Barrels hide defining files and tend to expose symbols that should remain internal; they provide no tree-shaking benefit.

**Required alternative:** import directly from the defining file. Existing barrels are legacy context, not permission to extend them. Published package entry points follow the sole canonical exception documented by code-structure, not a Vue-component exception.

## Consolidation decisions use design merit

**Banned:** defending an existing wrapper, visual delta, broad prop range, or leftover duplication solely because changing it would touch more files. The zero-edit option carries the same burden of proof as the proposed change.

**Why:** diff size measures effort, not correctness or architecture. Workaround artifacts can otherwise become mistaken for intended design, and half-finished simplifications leave duplicate constants, unreachable guards, and stale contracts behind.

**Required alternative:** read old implementation comments before defending behavior produced by a workaround. Compare options by design intent, ownership, consistency, and consumer value. Complete the approved consolidation by collapsing restated constants, deleting unreachable guards, and removing dead surface, or explicitly report why a deliberate leftover remains.

## Prose scenarios

- A function answering whether a result is read by only calling the store's existing read predicate is inlined. A named read-results set used repeatedly can carry the domain intent without that function.
- A helper that branches and narrows a persisted union earns its name. A helper that only converts a value and delegates once does not.
- A workflow composable may combine selecting a view and opening its panel into one new action. It may not return the selection store's select action under a renamed key.
- A lightbox composable that creates a private engine tied to its current image exposes that engine under one delegation key. It does not re-publish every engine member.

## Review checklist

- Every named function adds information, behavior, dependency decoupling, or a tested domain concept.
- Components do not forward dependencies or composable outputs between units.
- Returns contain only owned, derived, or newly composed behavior, with the per-caller service exception intact.
- Imports resolve defining files directly without new or extended barrels.
- Repeated keyed getters remain legitimate owner APIs rather than being replaced by consumer relays.
- Recommendations and cleanup decisions rest on design merits, and no half-finished consolidation remains unexplained.
