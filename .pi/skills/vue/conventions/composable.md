# Composable Convention

**Required.** Use this guide when extracting component-scoped reactive state, lifecycle behavior, DOM integration, or a workflow. Read [state-dependency anti-patterns](../anti-patterns/state-dependencies.md) and [wrapper-and-relay anti-patterns](../anti-patterns/wrappers-and-relays.md) with it.

## Responsibility and scope

A composable owns stateful logic: refs, computed values, watchers, lifecycle hooks, and component-tree store interactions. It encapsulates how a concern works so the component only binds the resulting state and actions. One composable owns one intentional concern.

The default scope is one caller's render cycle. Shared state within a component tree belongs to a composable owned by the common orchestrator and reaches leaves as props. A Pinia store is a deliberate exception for genuinely cross-cutting state, not the default sharing mechanism.

Presence and selection booleans derive from source-of-truth identifiers such as an id, name, or key, not from a resolved object. Resolved data can be null while loading without being absent. When a capability cannot yet be resolved, follow the project's allow-until-loaded convention and let the resolved data decide later.

## Name and placement

Name the file with the `use-` prefix and a domain phrase describing what it manages, not where it is called. Place it in a composables folder beside its consumers, parallel to helpers. Only actual use across unrelated codebase areas justifies a top-level composable.

Boolean refs use an `is` prefix, while boolean computed values use `is`, `has`, or `should` as the semantics require. Data refs use descriptive nouns, and collection derivations name both the collection and its derivation. Actions use verb-plus-noun names, and cleanup functions name the resource and cleanup action. Names such as `isModelMenuOpen`, `hasNoModelSelected`, `selectedModel`, `conversationsSortedByUpdated`, `changeModel`, and `revokeAllObjectUrls` demonstrate the intended specificity.

A group's shared-composables folder is for use by multiple subcomponents within that group. Dependency direction stays toward the local: a shared composable never imports a feature-local composable or helper. If its dependencies are feature-local, move the composable into that feature rather than widening its parameters to preserve a shared location.

See the [component-group convention](component-group.md) for consumer checks and shared-folder boundaries.

## Structure and public API

Organize a composable from top to bottom as imports, concern-local constants, and the exported function. Within the function, resolve composable and store dependencies first, then declare reactive state, computed values, watchers, and intentionally named functions, and finally return the public API.

Functions use descriptive verbs for the change, toggle, fetch, or cleanup they perform. Parameters and public returns have explicit types under the generic code-structure rules. Return only what a consumer legitimately needs.

A returned member must be owned by the composable, derived by it, or composed into behavior with new meaning. Never republish an imported composable, store, or service member unchanged or renamed. Consumers import the defining unit directly. The only sanctioned delegation exception is a privately created per-caller service instance whose internal wiring must remain connected; expose that instance once under a namespaced key rather than flattening its members.

## Compose by import

When a composable needs a store, helper, service facade, or another composable, it imports and calls that dependency itself. The component never relays one composable's outputs into another. Singleton stores, services, and shared state are resolved by the composable rather than threaded through component setup. Every importer of a Pinia store resolves the same Pinia-managed instance, so callers never need to thread stores through their parents; composables apply the same direct-composition discipline to each other.

Keep parameters for inputs that genuinely vary per call site. A caller-specific callback is legitimate; a sibling-owned ref, socket singleton, or connection-check pair forwarded by the component is not.

An application service assembled from stores is exposed through a dedicated composable that calls those stores and the plain assembler or factory helper. Consumers call that composable directly. No application-root provider, injection key, or injection fallback is involved.

## State lifetime

State declared inside the composable function is fresh per caller and remains the default. When the concern is semantically a singleton—one feature draft or editor state regardless of caller—declare its reactive state at module scope in the owning composable file and return the same state and actions from every call.

Document the singleton lifetime in the file JSDoc. Approved specs must reset that module state between tests. This is the only sanctioned alternative to a store-like standalone state module; a separate file of exported ref maps without an owning composable API remains prohibited.

A composable may call a Pinia store directly for component-tree derivations and workflows. It reads the store value directly rather than copying it into a local ref and reconciling the two with a watcher.

## Repeated keyed reads

When the same keyed lookup, fallback, optional access, or presence check over owned reactive records is needed more than once, expose a named owner-level getter with an explicit return type. Use it internally and from consumers so key handling and missing-value semantics have one home.

When consumers repeatedly compare the result with an expected value or test membership, extend that getter with an optional expected-value argument and explicit TypeScript overloads. The base call returns the value; the comparison call returns a boolean. Detect omission by argument presence rather than truthiness so valid falsy expectations work. A single-use lookup or comparison stays inline, and consumers never add relay wrappers around the getter. The canonical rule is [repeated keyed reads](../../code-structure/anti-patterns/coupling-and-indirection.md#repeated-keyed-reads-are-a-legitimate-owner-api).

## Prose examples

- A menu-position composable owns its caller's positioning lifecycle. A singleton prompt draft lives at module scope only when every caller must intentionally share that same draft.
- A feature composable that needs a feature-local helper moves into that feature's composables folder. It does not remain shared and receive the helper through a component.
- A selection boolean derives from the selected id while details load. It does not derive from the temporarily null selected record.
- A higher-level workflow may combine selection and opening a view into one new action. It may not return the selected ref and open method unchanged merely to give them another access path.

## Quality and completion

Non-trivial composables require co-located specs; trivial wrappers around tested helpers can skip them, although creating or updating any spec still requires consent. Read [testing](../quality/testing.md) for approved test work.

- The composable owns one concern and sits at its actual consumer scope.
- Components do not relay dependencies or outputs between composables.
- Every returned member is owned, derived, or composed into new behavior.
- Per-caller state is the default; singleton state is module-scoped, documented, and reset in approved specs.
- Store values are read directly without mirrored local state.
- Repeated keyed reads use an owner getter; single-use operations remain inline.
- Lifecycle and side effects have explicit ownership and cleanup.
