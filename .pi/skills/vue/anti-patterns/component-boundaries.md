# Component Boundary Anti-Patterns

Read this document whenever creating or changing components, stores, or component composition. Each prohibition below preserves explicit ownership and data flow. Constructive contracts live in the [presentational](../conventions/presentational-component.md), [orchestrator](../conventions/orchestrator-component.md), and [store](../conventions/store.md) conventions.

## Presentational leaves do not own dependencies or business state

**Banned:** a presentational leaf calls a store, mutates global state, or owns business logic, refs, computed values, or watchers. A component does not become presentational merely because it renders markup.

**Why:** hidden dependencies make the leaf's rendered output depend on application context rather than its declared contract. They also force consumers and tests to reconstruct that context.

**Required alternative:** an orchestrator or composable resolves dependencies and maps domain records to flat props. The leaf emits semantic intent or uses the sanctioned native value model. Substantive pure derivations move to helpers; tree-scoped state moves to the orchestrator's composable.

**Exception:** an orchestrator or deliberate container may read a store and feed leaves. A native value model is a synchronization contract, not independent business state.

## Stores never command components

**Banned:** a store contains a component instance, template ref, or component method, or an action invokes imperative component behavior such as playback, focus, or scrolling.

**Why:** the data owner then depends on a mounted UI lifetime and invisible DOM capabilities. Unmounting, testing, and alternative presentations all become coupled to that handle.

**Required alternative:** stores expose data and data mutations. Components and composables react to that data and own their DOM lifecycle. Cross-component data routes through orchestrator props or a deliberately justified store.

## Component exposure is not a shared-state channel

**Banned:** a parent reads a child's internal shared state through component exposure and a template ref, or exposed fields receive aliases that rename their underlying variables.

**Why:** the parent becomes dependent on child internals, while aliases drift from the actual state and obscure ownership.

**Required alternative:** consumers receive props or import the deliberately introduced store or composable directly. Expose only a genuine imperative DOM handle that the parent must own, with exposed names identical to their variable names.

## Components must not be relays

**Banned:** a component merely mirrors another component's or composable's API without adding presentation or behavior. Common symptoms are props that mirror destructured composable returns, emitted events that forward a received payload unchanged, and props passed down the chain without influencing any rendered output.

**Why:** every new control enlarges every relay contract, while the reader gains no new abstraction. Dead props remain invisible to the type system because their declarations and bindings still exist.

**Required alternative:** remove the relay and bind the defining unit directly, or give the component coherent chrome, derivation, or behavior that earns its boundary. Leaves announce their own user's intent. Delete dead props together with the declarations and bindings above them.

When auditing inherited props during a split, verify that each changes rendered output. An accent prop on a card with no accented element is dropped rather than carried into the new component. If state moves down into a former relay, move the lifecycle that activates or refreshes that state to the same owner.

## Business mutations do not live in markup

**Banned:** an orchestrator performs business-logic store mutation directly in template markup or embeds business branching in event expressions.

**Why:** template expressions hide workflow ownership and make the operation difficult to test and reuse consistently.

**Required alternative:** bind an intentionally named composable or store action. Keep template binding limited to the public action and display contract.

## Prose scenarios

- A row that imports a store to determine whether it is read violates the boundary. Its parent supplies the read state as a flat boolean prop.
- A playback store exposing current time is valid shared data; retaining the player component and invoking pause from a store action is prohibited component control.
- A parent that needs to scroll a list may own a genuine list DOM handle. It may not inspect arbitrary child selection state through that handle.
- A panel that only renames all of its parent's values and forwards every child event unchanged is removed or given real presentation ownership.

## Review checklist

- Leaves depend only on declared props, models, and semantic events.
- Stores contain no component handles and issue no component commands.
- Shared state does not travel through component exposure.
- Every component boundary adds presentation or behavior rather than relaying an API.
- Every declared prop has a rendered effect, and state lives with its activating lifecycle.
