# State and Dependency Anti-Patterns

Read this document before changing composables, stores, application services, or shared state. Constructive ownership decisions live in the [composable](../conventions/composable.md) and [store](../conventions/store.md) conventions.

## No dependency injection through Vue context

**Banned:** `provide` and `inject` in all forms, including shared mutable-state contexts, application-root service singletons, injection keys, and injection fallback contracts.

**Why:** a runtime key hides the dependency and provides no compile-time guarantee that a provider exists. Components are also forced to perform dependency plumbing on behalf of their composables.

**Required alternative:** tree-scoped shared UI state uses an orchestrator-owned composable and props. Genuinely cross-cutting data may use a deliberate store. Services and application singletons resolve by import through a dedicated composable that assembles or exposes the facade; consumers call that composable directly.

**Migration:** pre-existing context wiring is migrated away as it is touched and is never extended. There is no application-service exception.

## Pinia is not the default shared-state mechanism

**Banned:** introducing a store merely because more than one component needs a value, or to avoid mapping props at an orchestrator.

**Why:** a store widens lifetime and consumer access before actual consumer scope justifies it. It also obscures the primary owner of tree-scoped feature state.

**Required alternative:** follow the ownership ladder of caller-local composable state, orchestrator-owned tree state passed as props, documented composable-module singleton state, then deliberate Pinia state for genuinely unrelated consumers. Choose based on actual importers and coupling, not convenience.

## Store state must not be mirrored

**Banned:** copying a store value into a composable-local ref and synchronizing it back through a watcher.

**Why:** two writable representations create a dual source of truth and introduce timing, feedback-loop, and stale-value behavior.

**Required alternative:** read the store value directly or derive a computed value from it. A composable owns only state that genuinely belongs to its own concern.

## No standalone reactive-state drawers

**Banned:** a dedicated `*.state.ts` module exporting ref or shallow-ref maps without an owning composable API, actions, and coverage.

**Why:** this creates an uncontrolled store without Pinia's semantics or an intentional unit boundary. Ownership, mutation, lifetime, and test reset become implicit.

**Required alternative:** use a deliberate Pinia store when consumer scope justifies one. For a semantic composable singleton, hoist state to module scope inside that owning composable file, document its lifetime, and expose it only through the composable's API. Approved specs reset the state between tests.

## Shared units never depend upward on features

**Banned:** a top-level shared composable or a group's shared composable imports feature-local composables, helpers, or services.

**Why:** the supposedly shared unit becomes coupled to one feature, while its location falsely advertises general applicability. Passing feature values through a component to preserve that location adds a second violation.

**Required alternative:** move the composable into the feature whose dependencies it owns. Only genuinely unrelated consumers justify promoting it back to a shared location. Shared dependencies flow toward local ownership, never the reverse.

## Services do not travel through component relays

**Banned:** a component resolves a service, singleton, store pair, or shared reactive value and passes it between composables as an argument.

**Why:** the component becomes a hidden composition root for logic it should only bind, and the receiving composable's dependencies disappear into call-site-specific parameters.

**Required alternative:** the composable imports and calls its dependencies directly. Reserve parameters for inputs that genuinely vary per call site. If a composable privately creates a per-caller service instance whose wiring must remain intact, expose that one instance under a namespaced delegation key rather than recreating it or flattening its API.

## Prose scenarios

- A draft shared by every editor in one feature can be module-scoped inside its owning composable. Exporting an unrelated map of refs from a state drawer is prohibited.
- A shared formatting composable that imports one feature's parser moves into that feature. It does not receive the parser through an orchestrator argument.
- An application facade assembled from several stores is returned by a dedicated composable. No root provider or injection fallback is introduced.
- A component that copies a connection flag from a store into a local ref creates dual ownership; it reads the store flag directly instead.

## Review checklist

- No provider, injection key, injection fallback, or context shuttle was added or extended.
- Store use is justified by actual cross-cutting consumers.
- Store values have one source of truth and no mirrored local refs.
- Singleton state has an owning composable or store, documented lifetime, and approved test reset.
- Shared units import no feature-local code.
- Components do not plumb services or dependencies between composables.
