# Template and Composition Anti-Patterns

Read this document whenever changing Vue templates, props, models, events, slots, conditions, or component composition. Positive contracts are defined in the [presentational-component](../conventions/presentational-component.md) and [orchestrator-component](../conventions/orchestrator-component.md) conventions.

## No implicit control fallback chains

**Banned:** choosing different inner controls according to which prop was supplied or whether a slot exists. Prop-presence and slot-presence branches create an invisible precedence in which passing both silently drops one alternative.

**Why:** callers cannot tell which control will render from the declared contract, and the component impersonates several controls with incompatible behavior.

**Required alternative:** each content kind—such as a number stepper, text input, or model picker—is a dedicated component composed explicitly at the call site. An optional prop may toggle the presence of the single thing the component renders, such as a card's optional checkbox, but never select among kinds.

When splitting such a component, audit every inherited prop for an actual rendered effect. Drop a prop that changes nothing rather than carrying it into the new contracts.

## Slots do not inject behavior-bearing controls

**Banned:** using slots to substitute behavior-bearing controls with typed props and events, or using slot markup to supply data that the host renders as its own title, label, or badge.

**Why:** slot indirection hides which control is present and bypasses an explicit typed contract. It also invites substitutions that the host's chrome and behavior were not designed to contain.

**Required alternative:** props carry data; slots carry whole component content into legitimate layout regions. A behavior-bearing control is a dedicated component that owns its control, synchronizes values through a component model, receives side-effect hooks through `onX`-style callback props, and owns its scoped chrome. Forwarding an inner event payload unchanged is a relay smell.

Named and default slots remain appropriate for layout containers with regions: grids with rows, panels with header or action areas, and menus with bodies. One legitimate content area uses the default slot. Fixed internal content is composed inside the host and fed props rather than exposed as a slot.

**Exception:** a stateless lucide icon glyph typed as `LucideIcon` is data and may be passed as an icon component prop. This does not permit behavior-bearing controls as props.

## Native event objects are not value-synchronization contracts

**Banned:** emitting an input or change event whose payload is the browser event so the consumer must extract a value from the element, or maintaining a parallel value prop and input emit pair for a native-control wrapper.

**Why:** this is a disguised component model that forces every consumer to understand the child's DOM shape.

**Required alternative:** a leaf wrapping one native input, textarea, or select exposes `v-model` through `defineModel` and binds it directly to the native element. Replace a setter that only assigns the updated value with direct `v-model` binding. Keep a manual update handler only for real work such as clamping or side effects.

**Exception:** semantic interaction events remain events. A keydown used for consumer branching and a focus event used for a side effect do not represent value synchronization.

## Conditions stay on the element they toggle

**Banned:** `v-else-if` and `v-else` chains, conditional template wrappers, and elements that exist only to carry a condition around one component.

**Why:** a chain requires the reader to retain every previous condition to understand the fallback, while wrappers add DOM ownership without rendering a concern of their own.

**Required alternative:** each branch has its own plain `v-if` on its root element. Compound conditions merge at that element so both the selected mode and required data are visible together. A fallback uses the negated condition where the fallback renders. The orchestrator owns visibility for its child sections.

**Exception:** keyed swappable children inside `Transition` use the documented conditional chain because Vue's compiler must prove at compile time that exactly one child renders. Independent conditions are rejected for that case, so the keyed chain remains required there.

## No condition-only or spacing-only wrappers

**Banned:** a wrapper element that renders no concern of its own and exists only to hold a visibility condition or spacing class around one component.

**Why:** it adds a DOM node and splits styling ownership without adding information.

**Required alternative:** put the condition on the component root and move internal chrome into that component's scoped styles. Outer spacing remains with the parent's layout gaps. Follow the [styling-only wrapper boundaries](../../css/anti-patterns/styling-coupling.md#styling-only-wrappers).

## Defaults must be real defaults

**Banned:** listing an optional prop in `withDefaults` with an explicit undefined value, or retaining an empty `withDefaults` wrapper when no real default remains.

**Why:** an omitted optional prop is already undefined, so the entry is inert while suggesting that meaningful fallback behavior exists.

**Required alternative:** list only actual default values in `withDefaults`. When none exist, use plain `defineProps` without the defaults wrapper. The `vue/require-default-prop` lint rule is disabled, so optional props need no explicit undefined declarations.

## Templates do not own complex derivation

**Banned:** embedding formatting, business branching, or other logic in template expressions when a helper, computed value, store getter, or composable should own it.

**Why:** template logic obscures the unit responsible for the derivation and makes direct behavioral coverage harder.

**Required alternative:** format data in pure helpers or computed values owned by the correct composable or store. Templates bind the resulting display values and intentionally named actions.

## Prose scenarios

- A control that renders a stepper when a numeric prop exists and otherwise renders slotted text must become two explicit controls chosen by the caller.
- A panel may expose an actions region for caller-supplied components. Its own fixed title is a typed prop or internally composed content, not slot markup.
- A fallback panel renders when the negated active-tab condition is true on the panel itself. No conditional template wrapper surrounds it.
- An optional title with no real fallback uses no defaults entry. An optional count with a genuine zero default retains that real default.

## Review checklist

- Every control kind is explicit at the call site; no prop or slot precedence selects it implicitly.
- Props carry data, and slots carry only legitimate component layout regions.
- Native values synchronize through models rather than browser event payloads.
- Visibility sits directly on each branch root, with only the documented transition exception.
- No template, condition-only, or spacing-only wrapper adds an unowned DOM layer.
- Defaults contain only real values, and complex derivation has a named non-template owner.
