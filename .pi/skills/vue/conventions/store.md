# Pinia Store Convention

**Required.** Use this guide before introducing or modifying a Pinia store. Read [state dependencies](../anti-patterns/state-dependencies.md), [component boundaries](../anti-patterns/component-boundaries.md), and [wrappers and relays](../anti-patterns/wrappers-and-relays.md) with it. Official reference: [Pinia](https://pinia.vuejs.org/introduction/).

## Justify the store

A store is a deliberate exception for data that genuinely routes across many unrelated components and for which orchestrator-owned props would create worse coupling. It is never the blanket answer to shared state.

Use this ownership ladder:

1. Caller-local reactive state stays inside the composable function.
2. Tree-scoped feature state belongs to the common orchestrator's composable and reaches leaves as props.
3. A semantic singleton owned by one composable may live at that composable's module scope with documented lifetime and test reset.
4. Genuinely cross-cutting shared data may justify a Pinia store.

A separate module of exported refs is not an intermediate option. The distinction is ownership and actual consumer scope, not a desire to avoid prop declarations.

## Store responsibility

A store holds reactive domain data, owner-level getters and synchronous derivations, and actions that mutate that data. Components react to store data; the store never controls components.

Never store a component instance, template ref, or component imperative method. A store action must not call play or pause on a mounted player, force focus, scroll a child, or otherwise command a component. Lifecycle, DOM behavior, timers, sockets, and multi-unit workflows belong to their documented owning composable or service boundary; substantive pure transformations belong to helpers. Follow the canonical [placement audit](../../code-structure/quality/placement-audit.md) for effect ownership.

Define one store per file. Name the file after its domain concept and the setup-store function with the idiomatic use-prefix and store suffix; for example, `left-toolbar.ts` exposes `useLeftToolbarStore`. Keep the public surface limited to data and operations that consumers legitimately need.

## Component and composable access

Orchestrators may read a justified store and map its records to the flat props required by leaves. Presentational leaves never access it. A composable may access a store directly when owning component-tree derivations or workflows.

Consumers import the defining store directly. A composable must not return store refs or methods unchanged, under either their original names or aliases. If a workflow genuinely combines several store operations into new behavior, that composed action earns its own name.

Never mirror a store value into a composable-local ref and synchronize it back with a watcher. That creates two sources of truth. Read the store's value or use an owner-level derivation instead.

## Repeated keyed reads

Centralize repeated keyed lookup, fallback, optional access, and presence checks in a named store getter function with an explicit return type. Internal operations and consumers use that owner API instead of repeating raw indexed access.

If the result is repeatedly compared with an expected value or tested for membership, use the getter's optional expected-value form with explicit TypeScript overloads. The base call returns the value and the comparison call returns a boolean. Omission is detected by presence rather than truthiness. Single-use operations stay inline, and raw state remains available where Pinia requires it or a test intentionally asserts key existence. See the canonical [keyed-read rule](../../code-structure/anti-patterns/coupling-and-indirection.md#repeated-keyed-reads-are-a-legitimate-owner-api).

This owner getter is legitimate behavior, not a banned wrapper. A consumer-side function that merely delegates to it is a banned relay.

## Prose examples

- A wizard's current step belongs to the orchestrator's composable even when several wizard leaves need it. Moving it to Pinia would widen its lifetime without adding a consumer boundary.
- One shared prompt draft can be module-scoped in its owning composable when every caller intentionally addresses the same feature draft.
- Authentication or application-wide connection data may justify a store when unrelated areas genuinely consume it.
- A media store may expose playback data. It may not retain a player component and invoke that component's methods; a component or composable reacts to the data and owns the DOM lifecycle.

## Quality and completion

Store specs live beside the store and cover real derivations, interaction contracts, and owned side-effect wiring. Creating or updating them requires consent; read [testing](../quality/testing.md) for approved work.

- Actual unrelated consumers justify the store better than the prop-based alternative.
- The store owns data and data operations, not component handles or commands.
- Orchestrators map store data to leaf props; leaves remain isolated.
- No composable mirrors or republishes store state or actions.
- Repeated keyed reads use a typed owner getter with a comparator form only when repeated comparisons justify it.
- State, workflows, pure transformations, and effects remain with their proper owners.
- Approved store coverage is co-located and isolates Pinia state between tests.
