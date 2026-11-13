# Orchestrator Component Convention

**Required.** Use this guide for a group's main component, a section orchestrator, or an interactive widget that wires state and presentation. When extracting leaves, also read the [presentational-component convention](presentational-component.md). Review [component boundaries](../anti-patterns/component-boundaries.md), [template composition](../anti-patterns/template-composition.md), and [wrappers and relays](../anti-patterns/wrappers-and-relays.md).

## Responsibilities

An orchestrator:

1. Calls the composables from which its template binds and reads deliberately introduced stores.
2. Wires genuinely cross-cutting UI behavior, such as closing menus when a feature deactivates.
3. Maps domain records to the flat props required by leaves.
4. Assembles presentational components and owns their visibility conditions.
5. Exposes only genuine imperative DOM handles when a parent must own one.

It does not contain inline business logic, business-logic store mutations in markup, or complex data derivation. Those belong to store actions, composables, or pure helpers according to their behavior. No store holds a component handle or commands a component.

## Keep setup thin

The setup script contains the props contract, store reads needed to configure children, and one composable call per concern from which the template binds. A tree-scoped data composable typically owns the reactive state, computed values, watchers, and functions and returns the display values and actions the template needs.

The orchestrator never destructures one composable's outputs only to forward them into a sibling composable. Dependencies and choreography between composables belong inside those composables. Parameters are reserved for values that genuinely vary at the call site.

Feature-scoped state owned by the orchestrator—such as a playback session or wizard progress—lives in its composable and flows to leaves as props. Introduce a store only for genuinely cross-cutting state that would otherwise create worse coupling. A data composable still owns per-props derivation, formatting coordination, and transient widget state.

## Decompose presentation

Each distinct template section becomes a presentational subcomponent in its own folder. The orchestrator keeps the condition that determines whether the section appears and passes the section's flat values. It does not wrap one child in an element solely to carry a condition or spacing; the condition sits on the child, internal chrome belongs to the child, and outer spacing remains with the parent's layout.

A component that only mirrors the parent's composable returns, forwards events unchanged, or passes dead props is a relay rather than an orchestrator. Remove that boundary or give it real ownership. When state moves into a component, the lifecycle that activates or refreshes that state moves with it.

## Dropdown and menu structure

A dropdown menu splits into an orchestrator and a co-located trigger component. The trigger owns the anchor ref, the `useMenuPosition` composable, the `Teleport`, and outside-click self-closing behavior. It exposes a default slot for the menu body so the orchestrator supplies the form or data while the trigger retains positioning and dismissal concerns.

The trigger renders a fixed transparent `{menu}__backdrop` element named within the menu's BEM block. The backdrop covers the viewport, sits one z-index step below the dropdown panel, and emits close when clicked. Do not replace this with coordinator-level `onClickOutside` handling plus `[data-*]` ignore selectors.

## Imperative exposure

Shared state never flows through `defineExpose` and template refs. Consumers receive props or read the deliberately introduced store directly. Retain `defineExpose` only for an actual imperative DOM handle the parent must own, such as a scrollable-list handle. Exposed fields keep exactly the same names as their variables; compatibility aliases that rename the symbol are not added.

## Location and quality

The main orchestrator lives at the root of its named component-group folder as a sibling of its subcomponent folders. A sub-orchestrator follows the same rule recursively. See the [component-group convention](component-group.md).

Orchestrators are canonical candidates for a spec because wiring is their behavior. Orchestrators and stateful widgets are also the components eligible for stories. Creating or updating either artifact requires consent; read [testing](../quality/testing.md) and [Storybook](../quality/storybook.md) only for approved work.

## Prose examples

- A chat orchestrator wires its toolbar, exchange list, input, and details panel. It maps each selected record into leaf props but leaves message derivation and lifecycle workflows to composables.
- Closing several menus when a view deactivates is legitimate cross-cutting orchestration. Formatting a selected model's capabilities is derivation and belongs elsewhere.
- A dropdown trigger owns anchor positioning and dismissal while its orchestrator decides which menu content appears.

## Completion checklist

- Setup contains only contracts, dependency binding, and cross-cutting wiring.
- No composable outputs are relayed into sibling composables by the component.
- Distinct template sections are presentational components with flat props.
- Feature state lives in the owning composable; a store is a justified exception.
- Dropdown positioning and self-closing behavior belong to the trigger.
- Component exposure is limited to identically named imperative DOM handles.
- The orchestrator's location, spec, and story follow their respective conventions.
