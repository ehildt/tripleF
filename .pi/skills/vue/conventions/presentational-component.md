# Presentational Component Convention

**Required.** Use this guide for a leaf, shared UI primitive, native-control wrapper, or template section extracted into a component. Read [component-boundary anti-patterns](../anti-patterns/component-boundaries.md) and [template-composition anti-patterns](../anti-patterns/template-composition.md) with it.

## Responsibility and contract

A presentational component renders exactly what it receives and communicates semantic user intent. It does not access Pinia, mutate global state, or own business logic. Its props are the flat values it renders—a title, level, count, or state flag—not the domain record from which the parent read those values. The parent maps a record once at the call site so the leaf stays independent of API types.

A pure leaf owns no local ref, computed value, watcher, or store call. A native value model declared through the sanctioned value-synchronization contract is not independent widget state. Any substantive derivation belongs in a helper or the owning composable; the parent owns visibility rather than the leaf hiding itself.

A healthy leaf announces its own user's intent. It does not repeat a parent's announcements unchanged or declare values that no rendered output consumes.

## Names and files

- Component files and symbols use a PascalCase noun phrase that names the rendered UI element.
- Every component has its own kebab-case folder named after the component, including simple shared primitives.
- Props live in a co-located `Xxx.types.ts` file as a named `XxxProps` interface. Every field has JSDoc explaining what it carries and why. Never declare an anonymous props type inline in `defineProps`.
- A composable deriving the component's data imports the same props interface instead of declaring a subset.
- Boolean props use `is`, `has`, or `should` when that reads naturally; prefer `isOpen` over `showMenu`. Event names describe the resulting intent, such as `selectModel`, rather than an ambiguous bare `select`. Local handlers use `on` plus the event name, such as `onFileInputChange` or `onDocumentClick`.
- Tests and stories follow the [quality router](../SKILL.md#route-the-task) and require consent. A pure leaf is covered transitively by its parent; a leaf that owns interaction logic receives a spec, but leaves do not receive stories.

For components that legitimately own behavior, setup order is imports with Vue first, external packages next, and internal modules last; then the props, models, and emits contract; then derived values; then template refs. A pure presentational leaf normally needs only its imports and contract.

## Value synchronization and events

A leaf wrapping one native input, textarea, or select exposes its value through `v-model`, declared with `defineModel` and bound directly to the native element. Do not create a parallel value prop and input event pair, and do not emit the browser event so the consumer must extract the value from DOM internals.

Semantic interaction events remain events. A keydown on which the consumer branches or a focus event that triggers a side effect is not value synchronization. A thin setter that only updates a model is replaced by direct `v-model` binding; a manual update handler remains only when it performs real work such as clamping or side effects.

Optional defaults appear only when they are real defaults. An optional prop needs no explicit undefined default. See [template-composition anti-patterns](../anti-patterns/template-composition.md).

## Template, slots, and styles

- Keep complex logic out of templates. Format or derive display data in helpers or computed values owned by the appropriate stateful unit.
- An optional prop may toggle the presence of the single thing the component renders, but it must not choose among different kinds of control.
- Props carry data the component renders as its own content. Slots carry component content into layout regions the host cannot enumerate as props.
- A component with one legitimate content region uses the default slot. Fixed internal content is composed internally rather than exposed as an interchangeable slot.
- Behavior-bearing controls are dedicated components composed explicitly by the caller, not injected through slots. Stateless icon shapes are the documented data exception and may be supplied as a typed icon prop.
- The root class is the component's own BEM block, never an element of the parent's block. Scoped styles use `var()` design tokens and real CSS pseudo-classes for state, with no hardcoded colors or `@apply`; follow the [CSS skill](../../css/SKILL.md).

## Extraction decisions

Extract a template block when it renders a distinct concern such as a header, callout, list, or panel row. Give the extracted leaf its own folder and props type. The orchestrator retains the visibility condition and passes flat values; the leaf owns its markup and internal chrome.

Do not extract a wrapper that only renames another component's contract or forwards its events. Extraction must add a coherent presentation boundary.

## Prose examples

- A session row receives the session title, activity label, and unread count. It does not receive the whole API session and does not know how those values were derived.
- A text-field leaf synchronizes its text through a model but separately emits a semantic submit intent when the user presses the appropriate key.
- A card may optionally render its own checkbox. A component that chooses among a number stepper, text input, and model picker based on supplied props must instead become explicit control components selected by the caller.
- A fixed toggle-header title row is composed inside the toggle header and fed props. A layout panel may expose an action region when the caller genuinely supplies whole components.

## Completion checklist

- The leaf renders flat supplied values and has no dependency on a domain record or store.
- Its props contract is external, named, documented, and reused by any deriving composable.
- Value synchronization uses a component model; semantic intents remain events.
- No local reactive state or business derivation remains in a pure leaf.
- Props, slots, and explicit control composition follow their distinct roles.
- Visibility stays with the parent, and the leaf owns its BEM block and internal styles.
- Pure leaves have no story; behavior and coverage follow the consent-gated quality guides.
