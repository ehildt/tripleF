---
name: vue
description: Vue 3 and Pinia architecture, component groups, composables, helpers, testing, and Storybook conventions. Use when creating, editing, moving, or reviewing Vue components, component contracts, reactive state, stores, pure helpers, tests, or stories.
---

# Vue Architecture Router

Use this file to select the minimum guidance needed for the task. Read every applicable convention and anti-pattern document before implementation; reading a convention does not implicitly load its related anti-patterns. Load quality guidance only for the test or story work actually in scope.

Generic structural rules are canonical in [code-structure](../code-structure/SKILL.md). Styling, localization, and quality gates remain canonical in [css](../css/SKILL.md), [localization](../localization/SKILL.md), and [lint](../lint/SKILL.md). Where this skill repeats a generic rule, it only adds the Vue-specific form.

Official framework documentation: [Vue 3 guide](https://vuejs.org/guide/introduction.html). Integration-specific documentation is linked from the convention or quality document that uses it.

## Select the unit

| Need | Default unit |
| --- | --- |
| Render supplied values and announce user intent | Presentational leaf with flat props, semantic events, or a value model |
| Wire a component group, stores, composables, and cross-cutting UI concerns | Thin orchestrator |
| Own reactive state, lifecycle, DOM behavior, or a component-tree workflow | Composable; state is fresh per caller unless explicitly documented as a singleton |
| Share tree-scoped feature state | Orchestrator-owned composable, passed to leaves as props |
| Share genuinely cross-cutting state across many unrelated components | Deliberate Pinia store, never the default |
| Compute a substantive result without state or side effects | One pure helper function |

## Route the task

| Task | Required conventions | Required anti-pattern review |
| --- | --- | --- |
| Create or edit a presentational leaf or native control wrapper | [Presentational components](conventions/presentational-component.md) | [Component boundaries](anti-patterns/component-boundaries.md), [Template composition](anti-patterns/template-composition.md) |
| Create or edit an orchestrator, interactive widget, dropdown, or extracted template section | [Orchestrator components](conventions/orchestrator-component.md); add the presentational guide when leaves are involved | [Component boundaries](anti-patterns/component-boundaries.md), [Template composition](anti-patterns/template-composition.md), [Wrappers and relays](anti-patterns/wrappers-and-relays.md) |
| Create, move, rename, or review a component group | [Component groups](conventions/component-group.md); add guides for every unit touched | [Wrappers and relays](anti-patterns/wrappers-and-relays.md) |
| Add reactive logic, lifecycle behavior, or a component-tree workflow | [Composables](conventions/composable.md) | [State dependencies](anti-patterns/state-dependencies.md), [Wrappers and relays](anti-patterns/wrappers-and-relays.md) |
| Introduce or modify a Pinia store | [Stores](conventions/store.md) | [State dependencies](anti-patterns/state-dependencies.md), [Component boundaries](anti-patterns/component-boundaries.md), [Wrappers and relays](anti-patterns/wrappers-and-relays.md) |
| Extract pure logic or evaluate a wrapper function | [Helpers](conventions/helper.md) | [Wrappers and relays](anti-patterns/wrappers-and-relays.md) |
| Create, update, or review tests | [Testing](quality/testing.md); add the guide for each unit under test | Add anti-pattern documents for any implementation changes |
| Create, update, or review stories | [Storybook](quality/storybook.md); add the guide for the component being documented | Add anti-pattern documents for any implementation changes |

## Always apply

- Names answer what the symbol does; one file owns one concern, and imports target the defining file directly.
- Files live beside their consumer unless actual unrelated importers make them shared. Explicit public types use their co-located producer-owned types file.
- Presentational leaves receive flat values rather than domain records. Orchestrators and composables own dependencies and state; leaves do not.
- Scoped styles use BEM naming and `var()` design tokens through the CSS skill. Helpers return localization keys and parameters rather than importing or receiving the translator.
- Creating or updating test and story files requires explicit user consent. Existing tests are a regression net and a contract, not infallible proof; report a breaking change before modifying either implementation or test.
- Judge recommendations by design merit, not diff size. Finish consolidations and remove dead leftovers rather than defending them by effort avoided.
- Before quality gates, repeat the placement and purity audit for all touched stores, composables, helpers, private functions, and immediate consumers. See the [placement audit](../code-structure/quality/placement-audit.md).

## Anti-pattern index

| Document | Prohibited territory |
| --- | --- |
| [Component boundaries](anti-patterns/component-boundaries.md) | Leaf store access or owned business state; stores commanding components; shared state through component exposure; component relays and dead props |
| [State dependencies](anti-patterns/state-dependencies.md) | Dependency injection through Vue context; stores by default; mirrored store state; stray state modules; shared units importing feature-local code |
| [Wrappers and relays](anti-patterns/wrappers-and-relays.md) | Rename-only functions; composable proxy returns; component-forwarded dependencies; aliases and barrels; consolidation decisions based on edit count |
| [Template composition](anti-patterns/template-composition.md) | Implicit control fallback; control-injection slots; event-object value synchronization; conditional chains and wrappers; inert defaults |
| [No barrel files](../code-structure/anti-patterns/coupling-and-indirection.md#no-barrel-files) | Re-export-only aggregation is canonically banned across the monorepo, including proxy-barrel behavior in function or composable form |

Each linked document states the rule, rationale, exceptions, and required alternative. Its examples are prose scenarios; the codebase remains the authoritative source of concrete implementation shapes.
