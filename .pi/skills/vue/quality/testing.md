# Vue Testing Convention

**Consent-gated.** Creating or updating any spec requires explicit user consent. This guide also applies when reviewing existing coverage. Existing tests are a regression net and document prior behavior, but they are not infallible: investigate both implementation and test when they disagree. If a change would break a test, report that before modifying either side.

Official references: [Vitest](https://vitest.dev/guide/) and [Vue Test Utils](https://test-utils.vuejs.org/guide/).

## Measure behavior, not file size

A component's logic density determines coverage. A long component that only binds a composable can be covered through that composable, while a very small interactive widget may need its own spec.

Write component specs for:

- Orchestrators, because composable and store wiring is their behavior.
- Interactive widgets such as dropdowns, modals, and lightboxes when they own keyboard handling, focus, navigation, or other internal state.
- Components with meaningful setup behavior, including reactive derivation, watchers, branching handlers, or complex conditional rules.

Skip a separate component spec for pure props-to-markup leaves, components that delegate everything to a tested composable or store, and leaves already exercised through their parent. A leaf that merely re-emits parent events is trivial pass-through, although that relay shape is itself an implementation anti-pattern. Story coverage never substitutes for behavioral assertions over time, user input, or store interactions.

Every pure helper has a co-located spec. Composables and stores need specs when they contain real behavior: complex derivations, getter combinations, store-interaction contracts, or owned watchers, persistence, socket calls, and subscription synchronization. A trivial composable around a tested helper can skip a separate spec.

## Co-location and naming

A `.spec.ts` file carries the covered unit's name plus the spec role suffix. Component, local-composable, helper, and store specs live beside those units. Shared-composable specs stay beside the shared composable in its actual shared location. Moving a unit includes moving its coverage without leaving a forwarder.

## Store and composable isolation

A store or store-using-composable spec follows these conventions:

1. Create and activate a fresh Pinia in `beforeEach` with `createPinia` and `setActivePinia` so state is isolated.
2. Seed real stores with fixture state wherever getters read them; setup-store refs may be assigned directly.
3. Mock API and socket boundaries at module level with `vi.mock` factories and any shared mock functions in `vi.hoisted`.
4. Drive the public API through actions and state writes, then assert getters, state, and boundary interactions.
5. Await the reactive tick before asserting default-watcher effects.
6. Clear persisted keys between tests when the unit hydrates or persists state.
7. Reset module-scope singleton composable state between tests.

## Teleport and event propagation

A leaf rendered through a teleport still emits to its slot-owning parent. Do not stub the teleport when testing those emissions because stubbing can swallow non-model component events. Mount it for real and query the teleported DOM through the document body.

## jsdom and Vue Test Utils gotchas

- **Object URLs:** jsdom's `URL.createObjectURL` and `URL.revokeObjectURL` can throw when browser-internal Blob buffers are represented by plain test files. Mock them in spec setup after `resetAllMocks`; creation returns an opaque test value and revocation performs no work.
- **Disabled controls:** Vue Test Utils' `trigger()` drops synthetic events on disabled buttons. Dispatch the DOM event manually when the attached listener itself is under test. Real browsers also suppress mouse events on disabled buttons, so a hover hint that relies on them needs a design correction rather than only a test workaround.
- **Watcher timing:** default watchers flush asynchronously, while immediate watchers have already run at instantiation. Await the tick for persistence or store writes. Moving watchers between composables and stores changes when effects fire, so fixtures must provide the same real references that the production tree drives.
- **Store-backed props:** when exercising a presentational input, simulate the container round-trip by supplying the updated draft prop before asserting the resulting contract.
- **Fixture drift:** `tsconfig.app.json` excludes spec and story files. Type fixtures faithfully against imported domain types, freeze literal configs, and preserve literal unions rather than allowing keys to widen silently to strings.

## Prose evaluation examples

- An orchestrator spec verifies that its composables and store actions are wired to the correct child contracts; it does not duplicate every pure helper assertion.
- A pure badge receives no isolated spec merely because its markup is long. Its parent's behavior coverage exercises it.
- A dropdown story can show open and closed appearances, while a dropdown spec verifies keyboard dismissal and focus behavior.
- A composable that only returns a tested helper's result can skip a spec; one that watches and persists that result needs coverage of the watcher contract.

## Completion checklist

- Consent exists for every created or updated spec.
- Coverage follows behavior ownership and logic density rather than line count.
- Helpers, orchestrators, widgets, and non-trivial composables or stores have the required coverage.
- Specs are co-located and use isolated Pinia, realistic fixtures, and explicit async flushing.
- Teleports, object URLs, disabled controls, and store-backed props follow their documented test semantics.
- Stories are not cited as replacements for behavioral tests.
- A failing existing test is investigated and reported before either implementation or test is changed.
