# Post-Implementation Placement Audit

**Required after implementation and before lint, tests, or Storybook gates.** Review actual ownership, consumer scope, and purity across the entire approved scope. Do not inspect only newly created files or the most obvious parsing logic.

A change can alter the correct owner or turn a formerly local unit into a shared one. Include all touched stores, composables, helpers, remaining private functions, unaffected-looking siblings in scope, and immediate consumers.

## Stores

Shared state belongs to its primary domain context. Widget-owned state stays under the widget area; sharing a domain value with a widget does not make it widget state.

Stores retain owner-level getters, synchronous derivations, and mutations. Fetching, lifecycle, sockets, timers, and multi-unit workflows do not move into them.

## Composables

Component lifecycle, DOM behavior, sockets, timers, and workflows belong in composables. Actual unrelated consumers determine whether a composable is local, feature-shared, or app-shared.

Singleton state remains in its owning composable and is documented and reset in affected approved specs. Returns must own, derive, or compose behavior rather than relay dependencies.

## Helpers

Review parsing, validation, defaulting, normalization, key building, and substantive pure transformations. Each helper takes inputs and returns output without reading storage, clocks, network, DOM, stores, or other external state.

Keep owner-level getters, synchronous mutations, and trivial inline operations with their owner. Never extract solely to reduce file size.

## Side effects

Storage writes, network calls, clock reads, and similar effects stay in the owning store action or watcher, composable workflow, or API module. Never make an impure operation look pure by moving it into a helper-named file.

## Completion

Move misplaced units without compatibility forwarders. Update every direct import and co-located type or approved spec path, and remove stale locations. Report any deliberate exception rather than treating passing static gates as proof of correct placement.

## Audit checklist

- Every touched unit has a primary owner grounded in its actual domain and consumers.
- Stores, composables, helpers, and private functions contain only behavior appropriate to their role.
- Local versus shared placement follows verified importers.
- No storage, network, clock, DOM, lifecycle, or workflow effect is disguised as pure computation.
- Moves are complete, direct imports are updated, and no forwarders or stale files remain.
- Deliberate exceptions are reported explicitly before quality gates run.
