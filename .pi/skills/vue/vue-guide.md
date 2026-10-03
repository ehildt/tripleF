# Vue Component Architecture Guide

This guide defines how we write Vue components, composables, helpers, tests, and stories. Every convention exists so that code reads as English — a future reader should understand intent from names alone.

Generic structure rules — names express intent, one function per file, co-located explicit types, role suffixes, co-location, no barrels, no wrapper functions — are canonically defined in the [code-structure](../code-structure/SKILL.md) skill; where wording overlaps with this guide, code-structure is canonical. Tests and stories are consent-gated: creating or updating them requires explicit user consent (`.pi/APPEND_SYSTEM.md` § Tests, Stories & Browser Automation); the sections on testing and stories here describe their shape when they exist.

**Skill files are prose-only.** This guide states rules, conventions, and reasons in words. It deliberately contains no code examples — the conventions it describes are visible in the codebase itself, which is the authoritative example.

For the quick rule-of-thumb reference, see [SKILL.md](./SKILL.md).

## How to use this guide

Read sections in order on your first pass. When working, jump straight to the section that matches what you're writing:

- **Adding a component or sub-component?** → Section 1 (Components) + Section 5 (Orchestrator Pattern)
- **Extracting a template block into its own component?** → Section 1 (Componentize template sections)
- **Typing a component's props?** → Section 1 (Props types live in a `.types.ts` file)
- **Adding a composable?** → Section 2 (Composables)
- **Adding a helper?** → Section 3 (Pure Helpers)
- **Considering a one-line wrapper function?** → Section 3a (Don't Write Wrapper Functions)
- **Considering a barrel file (`index.ts`)?** → Section 3b (No Barrel Files)
- **Adding a Storybook story?** → Section 4 (Stories)
- **Adding a test?** → Section 6 (Component Testing) + Section 7 (Composable Testing)
- **Naming something?** → Section 8 (Reference: Naming Decision Table)
- **Reviewing work?** → the Checklist in [SKILL.md](./SKILL.md)
- **Setting up a new component group?** → Section 5 (The Orchestrator Pattern) + Section 2's folder rules

---

## 1. Components: Presentational, Props-In Events-Out

A component renders UI. It receives data through props and communicates user actions through events. It does **not** access Pinia stores, mutate global state, or manage business logic.

### File naming

Components are PascalCase, in their own subdirectory named kebab-case after the component. A component group folder pairs the component file with its co-located `.types.ts` (props type), `.spec.ts` (when the component owns behavior), and sub-folders for its own sub-components. See the folder rules in [Section 2](#2-composables-stateful-logic-extraction) for where helpers, composables, and shared resources sit relative to it.

### Component structure

Order inside `<script setup lang="ts">`:

1. Imports (Vue first, then external, then internal)
2. `defineProps` / `defineEmits` — the contract
3. Computed values derived from props
4. Template refs

For the full naming conventions on props (prefer `isOpen` over `showMenu`, `selectModel` over bare `select`), see [Section 8: Reference: Naming Decision Table](#8-reference-naming-decision-table). Naming is documented once, not repeated per section.

### The v-model contract

A leaf whose job is wrapping a single native input, textarea, or select exposes its value through `v-model`, declared with the `defineModel` compiler macro and bound straight to the native element — no parallel `value` prop plus `input` emit pair. The smell this bans is an input or change emit whose payload is the browser's event object so the consumer can read the element's value off it: that forces every consumer to know the element's DOM shape and is a `v-model` in disguise. Value travels as a value. Interaction events that carry semantic intent — a keydown the consumer branches on, a focus that triggers a side effect — remain plain emits; the ban applies to value-sync only.

### Props types live in a `.types.ts` file

Props are never declared inline in `defineProps<{ … }>()`. Extract them to a named interface in a co-located `Xxx.types.ts` file, with a JSDoc comment on every field explaining what the field carries and why. The props type is the single source of truth: a composable that derives the component's data takes the same `XxxProps` type instead of re-declaring a subset of the fields.

### Templates and scoped styles

- Use BEM-style class names for scoped styles (see the CSS skill).
- Format data in helpers or computeds — no complex logic in templates.
- For CSS: use `var()` tokens, BEM class names, and real CSS pseudo-classes for state. Follow the [CSS skill](../css/SKILL.md).

### Componentize template sections

When a template block renders a distinct concern — a header, a callout, a list, a panel row — extract it into a presentational sub-component in its own folder. The orchestrator keeps the visibility `v-if` in its own template and passes the data as props; the leaf takes props and renders.

Rules for the extracted leaf:

- **Own folder, no leaf story.** Every extracted component gets `Xxx.vue` + a co-located `Xxx.types.ts` in its own folder inside the parent's folder. Leaf components don't get a `.stories.ts` — behavior is covered by a `.spec.ts` (when the leaf owns interaction logic) or the parent's spec.
- **Presentational only.** No store calls, no computeds, no refs — props in, markup out. Any logic lives in a helper or the orchestrator's composable.
- **The parent owns visibility.** The `v-if` stays on the component in the orchestrator's template; the leaf does not self-hide.
- **BEM block per component.** The leaf's root class is its own block (named after the leaf), not an element of the parent's block.
- **One slot, default.** When a component has a single content area, use the default slot — not a named slot.

---

## 2. Composables: Stateful Logic Extraction

A composable encapsulates reactive state, watchers, and **component-scoped** store interactions. It owns the "how" — the component only knows the "what" through the composable's return value.

**Scope boundary:** a composable returns values for one caller's render cycle. Shared state that crosses components surfaces through a composable owned by their common orchestrator and is passed to leaves as props (see [Section 5](#5-the-orchestrator-pattern)); a Pinia store is a deliberate exception for data that genuinely has to route across many unrelated components — opt-in, never the blanket default. A composable must never duplicate store state into a local `ref` and reconcile it back with a watcher; read the store value instead.

**Presence derives from identifiers, not resolved data.** A boolean answering "is X selected or present" is derived from the source-of-truth identifier — a name, an id, a key — never from a resolved object. Resolved data is null while it loads, and null-during-load is not absence; treating it as such disables UI at the exact moment the data is arriving. Where a capability check cannot yet resolve, default permissive and let the real data decide — the codebase's allow-until-loaded convention.

### File naming and location

Composables are named with a `use-` prefix, describing **what they manage** (not where they're used). See the [naming table](#8-reference-naming-decision-table) for the full pattern.

**Co-location rule:** a composable lives **next to the component(s) it serves** unless it is shared across the codebase. The test for shared: is this composable imported from more than one unrelated area? If not, it belongs next to its consumers, in a `composables/` folder parallel to `helpers/`. Only composables used across the whole codebase belong in the top-level `composables/` directory.

A component group folder is named after its main orchestrator and is laid out as: the orchestrator file at the group root (plus its spec/stories/types), a `composables/` folder for group-local composables, a `helpers/` folder (one helper per file, each with a co-located spec), and one sub-folder per sub-component (each following the same layout recursively). Resources shared across the whole group go in a `shared/` folder split into `ui/`, `composables/`, and `helpers/`.

### Folder structure rules

- **Each component group has a main orchestrator in the root.** A group folder has exactly one main orchestrator (the component the group is named after) as a sibling of the sub-component folders. See [Every group has a main orchestrator](#every-group-has-a-main-orchestrator-in-the-root).
- **Each component gets its own folder.** Even simple ones.
- **Sub-components live inside their parent's folder.**
- **The parent folder name matches the orchestrator's name (kebab-case).** A folder containing `ChatExchangeList.vue` is named `exchange-list/`, not `exchange/` or `exchanges/`.
- **Shared resources go in `shared/`.** If only UI, name it `ui/`. `shared/` is for _all_ shared things.
- **Helpers go in `helpers/` folders, one function per file.** Local helpers next to their consumer; shared helpers in `shared/helpers/` at the component group level. No loose helper files.
- **Composables go in `composables/` folders, parallel to `helpers/`.** `shared/composables/` is reserved for composables used by multiple sub-components within the group.
- **A sub-orchestrator gets its own folder** by the same rule that says sub-components live inside their parent's folder.

### Composable structure

A composable file is organized top-to-bottom as:

1. Imports (paths relative to the component group).
2. Constants (localStorage keys, sentinel values, …).
3. The exported function. Inside it, in order:
   - Composable/store instances the logic depends on.
   - Reactive state (`ref`).
   - Computed values.
   - Watchers.
   - Functions (named `changeX` / `toggleX` / `fetchX` — descriptive verbs).
   - The `return` of the public API — only what a consumer legitimately needs.

### Composition over relay: composables import composables

When a composable needs a store, a helper, a service facade, or another composable, it imports and calls that unit itself. A composable never receives singletons, service facades, or shared reactive state as arguments forwarded from a component's `<script setup>`. The component's setup script calls the composables it binds from and relays **nothing** between them: destructuring one composable's outputs to pass them into a sibling composable is wiring that belongs inside the composables. Keep an argument only when its value genuinely varies per call site — a prompt callback parameter is fine; a `Ref` owned by a sibling, a socket client, or a connection-check pair are not. This mirrors how Pinia stores already work: every importer of a store resolves the same pinia-managed instance, so callers never thread stores through their parents. Composables apply the same rule to each other (the wrapper-composable pattern: a higher-level composable composes lower-level ones by calling them directly).

**Dependency direction stays one-way toward the local.** A shared composable (top-level `composables/`, or a group's `shared/composables/`) never imports feature-local composables or helpers. If a composable's dependencies are feature-local, move the composable into that feature's `composables/` folder — do not widen what you pass in just to keep the file in a shared location.

**App singletons resolve by import, not provide/inject.** A service assembled from stores (an imperative facade over the socket/messages/debug stores, for instance) is exposed through a dedicated composable that calls the underlying stores and the plain assembler/factory helper, then returns the facade. Any composable or component that needs the service calls that composable. There is no app-root `provide`, no injection key, no `inject` fallback contract.

### Shared composable state lives at module scope

The default stays state created inside the composable's function body — fresh per caller. When the state is semantically a singleton (one draft/editor/menu state for the whole feature regardless of which composable or component asks), declare the `ref`/`reactive` at **module scope** of the composable file and return the same instance plus its mutating actions from every call. Document the singleton nature in the file's JSDoc and give the composable's spec a reset step between tests so module state cannot leak across assertions. This is the one sanctioned exception to the stray-state-module anti-pattern (rule 18 in [SKILL.md](./SKILL.md)): state hoisted inside its owning composable and exposed only through the composable's own API is still a composable. A bare `Xxx.state.ts` drawer of exported refs without actions and a spec remains banned.

### Composables call stores directly — for component-scoped logic

Composables access Pinia stores directly when the logic is scoped to one component tree (derivations, transient UI state, a widget's own flow). Components never call stores directly (unless it's a container component that reads a store and feeds leaves with props).

### No `provide`/`inject` — for anything

`provide`/`inject` is banned — for shared mutable state as a "context shuttle," and equally for app-level service singletons. Both hide the dependency behind a runtime key with **no compile-time guarantee** that a provider exists, and both force components to do dependency plumbing for their composables. Shared UI state follows the rule-18 ladder: a composable owned by the orchestrator passed to leaves as props, or — deliberately — a Pinia store. Services and app singletons resolve **by import** per the composition rule above: a dedicated composable assembles the facade from stores and returns it; consumers import and call it. Pre-existing provide/inject wiring is migrated away as it is touched, never extended.

---

---

## 3. Pure Helpers: One Function Per File, in `helpers/` Folders

### One helper function per file

Each helper function lives in its own `.helper.ts` file, named after the function. A helper file exports exactly one named function. This makes imports self-documenting and prevents "util drawer" files.

### What goes in a helper

Any function that:

- Takes input, returns output
- Has no side effects (no refs, no store calls, no DOM)
- Would otherwise be inlined in a `<script setup>` or a computed

### Helpers never localize

A helper that builds display data returns the translation machinery's input — the i18n key and its interpolation params — never a translated string. The caller performs the `t` call, because it already owns the translation runtime via `useI18n` or the `i18n` singleton. Passing the translate function as an argument, or importing the i18n singleton inside a helper, couples a pure transform to that runtime, scatters key namespaces across files that have no other reason to know them, and forces every spec to mock i18n. With the key returned instead, specs assert the key and stay pure — the locale schema test already guarantees the key exists. A helper also returns only the fields a consumer reads; a returned field that nobody renders is dead weight the type system will not flag.

### File naming and location

Helpers go in a `helpers/` folder co-located with their consumers — one function per file, never loose at the root of a component group. Shared helpers go in `shared/helpers/` at the component group level.

### Helper naming

Files are named after the function: `strip-html.helper.ts` exports `stripHtml`. Functions describe **what they compute or format**, using a verb prefix. See the [naming table](#8-reference-naming-decision-table) for the full pattern.

### Every helper must have a spec

Each helper has a co-located spec file with the same name plus `.spec.ts`, in the same `helpers/` folder. The spec exercises the function's inputs and outputs directly — no component mounts needed.

---

## 3a. Don't Write Wrapper Functions

A function earns its name only if the call site can't already see what it does. A wrapper that just renames a field or delegates to a single call is indirection without information: a reader who has to jump to the function learns nothing the call site didn't already say — the name isn't telling them anything new, it's hiding a one-line call behind a verb.

### Three legitimate alternatives

Pick one based on what would actually help a reader:

**1. Inline the call when no name is needed.** The store's (or prop's) own name already says what it does, so the call site should just make the call. Slightly longer, fully self-contained.

**2. Name the _binding_, not a one-line function around it.** If a value is reused or needs domain intent attached, name the **result** — a `Set`, a `computed`, a ref — not a function that wraps a single field access.

**3. Promote it to a real predicate in a `.helper.ts` file.** If the wrapper exists in many places and the predicate is part of the domain, give it its own file with its own tests. It then is a named function per the helpers rules, not a local indirection.

### How to decide

| You see…                                                                | Then…                                                            |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------- |
| A wrapper that just calls a single store method or prop lookup          | **Inline it.** The call site is already clear.                   |
| A wrapper used 3+ times in the same file with the _same argument shape_ | **Name the result** (a `Set`, a `computed`) — see option 2.      |
| A wrapper used across many files, with a domain meaning                 | **Promote it to a `.helper.ts` predicate** with its own spec.    |
| A wrapper that branches, supplies defaults, or has side effects         | **Keep it** — that is real logic.                                |
| A wrapper that only coerces/reshapes a value then calls once            | **Inline it** — the call site already says it.                    |
| A composable factory that returns a `computed` per key                  | **Keep it** — the factory creates reactive state, not a synonym. |

### Dependency injection is not a wrapper

A higher-order component/function that imports a store or composable and passes only the derived props a leaf needs is **not** the rename-wrapper anti-pattern — it earns its name by decoupling the leaf from the store/composable. The leaf stays presentational and testable; the container owns the dependency.

### What "real work" looks like (left alone)

The rule removes redundant indirection, it never bans small functions. These stay because they do real work:

- **Predicates with type narrowing and branching** — a type guard that narrows the input type earns its name.
- **One-liner helpers with their own file and tests** — a named domain predicate that lives in `helpers/` with a spec is a named function, not a wrapper.
- **Composable factories that return a per-key computed** — the factory creates reactive state per call; that is not a synonym.

---

## 3b. No Barrel Files

A barrel file is a re-export-only `index.ts` that aggregates imports from sibling files. We never add them. Import directly from the file that defines the symbol — the import path then _is_ the file, visible without opening anything.

### Why no barrels

- **The path is the file.** A direct import shows exactly where the symbol lives — useful for code search, refactors, and reading the import list at a glance.
- **Renames and moves stay local.** When a file moves folder, only its direct importers change. With a barrel, the barrel also moves or the import keeps working against a stale path.
- **Tree-shaking is unchanged.** Vite resolves the exact file either way; the barrel is not buying bundle size.
- **Barrels grow.** A barrel tends to accrete every export in the folder, including internal helpers and types that should never leak across group boundaries.

### The folder name is the symbol, not `index.ts`

The folder is the unit of co-location. If three siblings are imported together, the readers see three explicit file paths — that is the _information_ the import is supposed to carry. A barrel turns three explicit paths into one opaque path and asks the reader to chase it.

### Pre-existing barrels

A few older barrel files still exist in the codebase. They are not an argument to add new ones. New component groups do not get a barrel; new files do not register themselves in an existing barrel. Import directly from the file.

---

## 4. Stories: Visual Documentation for Orchestrators and Widgets

Orchestrators and stateful widgets get a story; leaf components don't. Story files are co-located with their components. A leaf's visual states are already exercised through its parent's story/spec, and per-leaf stories only bloat the Storybook sidebar.

### Story structure

A story file defines a `meta` object (`satisfies Meta<typeof Component>`) with:

- A `title` that mirrors the component group's folder hierarchy in a human-readable path (e.g. the group name, sub-group name, then the component).
- `tags: ['autodocs']` and a `parameters.docs.description.component` prose block explaining what the component is and does.
- `argTypes` declaring Storybook controls for visual-state props.
- `args` providing sensible defaults — event handlers wired with `fn()` from storybook's test utilities so interactions show up in the actions panel.

Each exported story is a named visual state with a JSDoc line describing what the reader sees.

Container components that read stores render fine in isolation: Storybook registers a fresh Pinia per story globally (see the shared preview decorator), so no local pinia setup is needed in each story.

### Story naming

Story names describe the visual state, not a generic "Default":

| Good                     | Bad             | Why                                          |
| ------------------------ | --------------- | -------------------------------------------- |
| `Closed`                 | `Default`       | Describes what the reader sees               |
| `Open`                   | `Active`        | "Open" is the visual state of the dropdown   |
| `ModelUnavailable`       | `Error`         | Specific about what's wrong                  |
| `Loading`                | `LoadingState`  | Concise; "State" is redundant                |
| `DisabledWithHoverBlink` | `DisabledHover` | Describes the interaction being demonstrated |

---

## 5. The Orchestrator Pattern

### What the orchestrator does

The top-level component (e.g., `Chat.vue`, or a section orchestrator) is an **orchestrator**. It:

1. Calls composables to get reactive state and actions, and reads shared stores
2. Wires shared state together (e.g., closing menus when chat deactivates)
3. Delegates presentation — leaves get props, containers read the store
4. Assembles presentational components in the template
5. Exposes only genuine imperative DOM handles via `defineExpose` (element refs a parent must own); shared state is read from the store — or received as props — by consumers directly

### What the orchestrator does NOT do

- No inline business logic in `<script setup>` — delegate to stores or composables
- No business-logic store mutations in markup — those live in store actions
- No complex derived state — move it to a store getter, a composable computed, or a helper
- A store is a deliberate exception, not the default; share data via the orchestrator's composable and pass it to leaves as props
- No store ever holds a component instance, a template ref, or a component's imperative methods; no store action commands a component

### The thin orchestrator

The orchestrator's `<script setup>` is deliberately thin: the props type, store reads that wire child config, one data-composable call when there is *component-scoped* data to derive, and the template.

The thin-orchestrator rule also bans **wiring between composables in the setup script**: calling composable A and forwarding its return value into composable B is choreography the composables must do themselves (see Section 2, *Composition over relay*). The orchestrator calls each composable it binds from, binds template slots/props from their returns, and stops there.

The orchestrator's shared state lives in its composable and is passed to leaves as props. Reach for a store only as a deliberate exception for data that genuinely routes across many unrelated components — and even then the store holds data plus data mutations, never component handles, and never commands a component. A data composable still has a place for genuinely tree-scoped derivation (formatting, per-props computed values, transient widget state) — it takes the component's props type, owns the `ref`/`computed`/`watch`/functions, and returns the display values + actions the template binds. Feature-scoped state the orchestrator itself owns — a playback session, a wizard's steps — lives in that composable and is passed to leaves as props; no store exists for it.

Cross-cutting wiring (closing menus on deactivation) legitimately stays in the orchestrator; data derivation does not. Shared data stays in the orchestrator's composable and is passed down as props; a store is the deliberate exception for the genuinely cross-cutting case.

### Recognizing a relay

A component that renders other components but owns no state of its own is a relay, not an orchestrator. Three symptoms give it away: its props interface mirrors the parent's destructured composable returns; every event it emits forwards the payload of an event it received, unchanged; and at least one prop is declared and passed down the chain yet never rendered anywhere below. A healthy leaf announces the user's own intents; a relay only repeats another component's announcements. The symptom matters because contract size drifts monotonically upward when control sits in the parent — every new control touches three layers and nothing ever leaves the contract. A prop that never reaches a rendered output is dead: delete it together with the declarations and bindings above it. When state moves down into such a component, the lifecycle hook that refreshes that state moves with it; state and its activation belong in one place.

### The orchestrator lives in its folder

The orchestrator component shares the **same folder** as its sub-components, composables, helpers, and stories. It is NOT a sibling file outside the folder. This makes the directory structure self-documenting: everything related to the group is in the group's folder, including the component that wires it all together.

### Dropdown menus: orchestrator + trigger

A dropdown menu splits into the orchestrator and a co-located `XxxTrigger` component. The trigger owns the anchor `ref`, the `useMenuPosition` call, the `<Teleport>`, and the **fixed transparent backdrop**; it exposes a **default slot** for the menu body, so the orchestrator supplies the form/data as slot content while the trigger keeps the positioning and self-close concerns.

The backdrop is a `{menu}__backdrop` element — `position: fixed`, covering the viewport, transparent, with a z-index one step under the dropdown panel — that emits `close` on click. That is how the menu closes on an outside click; **not** a coordinator-level `onClickOutside` wired with an ignore-list of `[data-*]` selectors. This keeps `triggerRef`/positioning and the close gesture out of the orchestrator's data path.

### defineExpose only for imperative DOM handles

Shared state must not flow through `defineExpose` + template refs: a parent that reads a child ref's internal state depends on the child's internals, and aliasing the exposed names drifts from the truth and confuses readers. Consumers read the store instead — a store has no alias surface.

Keep `defineExpose` only when a parent genuinely needs an imperative DOM handle it owns (for example, an action-bar element ref, or a list's scroll-to method), and **name exposed fields identically to their variables** — never add backward-compat aliases that rename the internal symbol.

Orchestrators are the canonical case for a `.spec.ts` — see [Section 6](#6-component-testing) for the full rule.

### Every group has a main orchestrator in the root

A component group (`chat/`, `dlq/`, `debug/`, …) is more than a bag of sub-component folders. It has **one** main component that wires the sub-components together for the consumer. This main component lives in the **root of the group folder** as a sibling of the sub-component folders, not inside one of them.

The parent's folder name is the kebab-case form of the main orchestrator's name:

| Group folder | Main orchestrator file   | What it wires                              |
| ------------ | ------------------------ | ------------------------------------------ |
| `chat/`      | `Chat.vue`               | left toolbar, exchange list, input, right toolbar |
| `dlq/`       | `Dlq.vue`                | list header, list body, details body       |
| `debug/`     | `Debug.vue` (or similar) | results, filters, health                   |

---

## 6. Component Testing

### The principle: test by logic density, not file size

A `.vue` file's complexity is measured by **how much behavior it owns**, not by how many lines it has. A 300-line atom can be a thin wrapper around a composable (skip the test, test the composable). A 17-line badge can be pure markup and styling (skip the test — its parent's spec covers it).

**Write a `.spec.ts` when the component owns meaningful behavior:**

- **Orchestrators** — they wire composables/stores and manage cross-cutting concerns. The behavior lives in the wiring; the test verifies the wiring holds.
- **Widgets** — interactive controls with internal state: dropdowns with keyboard handling, modals with focus traps, lightboxes with navigation. Even when they are "small atoms," the interaction logic is the component's reason for existing.
- **Any component with non-trivial logic in `<script setup>`** — refs, computeds, watchers, event handlers with branching, conditional rendering driven by complex rules.

**Skip the `.spec.ts` when the component is a thin presentational layer:**

- Pure styled markup driven by props.
- Components that delegate everything to a single composable or store — test that instead.
- Components that are exercised end-to-end through a story or a parent's test.

### Decision table

| Component shape                                          | Test? | Why                                                                                |
| -------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------- |
| Orchestrator                                             | ✓     | The wiring IS the component's behavior.                                            |
| Widget with state and interaction (dropdowns, modals)    | ✓     | Keyboard handling, open/close, focus management are its reason for existing.       |
| Component with a meaningful `<script setup>`             | ✓     | Any computed/branching/event logic deserves a test.                                |
| Pure presentational: props → markup/styles               | skip  | Covered by the parent's spec/story; any logic is in a tested helper or composable. |
| Leaf that just re-emits parent events                    | skip  | Trivial pass-through; tested transitively by the orchestrator's test.              |

**Story coverage is not a substitute for tests.** A `.stories.ts` captures the _visual states_ of a component. It does not assert behavior over time, branch on user input, or verify store interactions. A dropdown's story shows the menu open and closed; a test verifies that pressing `Escape` closes it.

### Teleport and event propagation

A leaf rendered inside a `<Teleport>` still emits to its parent component (the slot owner), so events flow normally in the app. In tests, **don't stub `Teleport`** when a teleported child emits to its parent — stubbing swallows non-`update:*` component emits. Mount for real and query the teleported DOM via the document body.

### jsdom / VTU gotchas

- **Object URLs**: jsdom's `URL.createObjectURL`/`revokeObjectURL` read browser-internal Blob buffers and throw on plain `File` objects. When the code under test creates object URLs, mock them in the spec setup (after any `resetAllMocks`) so `createObjectURL` returns an opaque string and `revokeObjectURL` is a no-op.
- **Disabled controls**: VTU's `trigger()` silently drops synthetic events dispatched to a `disabled` button, so a hover/click handler never runs. Dispatch the DOM event manually to reach the attached listener. Note real browsers also don't fire mouse events on disabled buttons — a hover-hint that depends on them is a design fix, not a test fix.
- **Watcher flush**: default watchers flush async. Assert watcher-driven effects (a localStorage persist, a store write) after awaiting a tick; `immediate` watchers already ran at instantiation. Consolidating several composables' watchers into one store changes *when* side effects fire across test paths — a prune/merge that used to live in a separate composable now runs wherever the shared store is instantiated; give test fixtures real references so the watcher behaves the way the production tree drives it.
- **Store-backed props**: presentational leaves derive state from props. When a test types in a leaf's input, it then flows the draft back down with a prop update to simulate the container round-trip, before asserting the resulting emit.
- **Specs aren't type-checked**: `tsconfig.app.json` excludes `*.spec.ts` and `*.stories.ts`, so fixture literals drift silently — a union-typed key widening to a plain string never fails compile. Type fixtures as faithfully as production inputs: freeze literal configs, and type records against their imported domain types.

---

## 7. Composable & Store Testing

### When to write composable/store tests

Write tests when the unit contains real behavior:

- Pure logic mixed into reactive wrappers (extract the pure logic to a helper and test that)
- Complex computed derivations or getter combinations
- Store interaction contracts (which store methods are called, with what)
- Side-effect wiring: watchers, persistence, socket calls, subscription sync

Trivial composables that wrap a tested helper can skip the spec.

### Test conventions

Tests for **local** composables live co-located with the composable in the component group directory. Tests for **shared** composables stay in the top-level `composables/` directory next to the source. Store specs (`Xxx.spec.ts`) live next to the store file they cover.

A store or store-using-composable test:

1. Creates a fresh Pinia and activates it in `beforeEach` (`createPinia` / `setActivePinia`) so each test gets isolated state.
2. Seeds real stores with fixture state where the getters read them (assigning to setup-store refs directly works).
3. Mocks the API and socket layers at the module level (via `vi.mock` factories, with any shared mock functions in `vi.hoisted`).
4. Drives the store/composable's public API (calls actions, writes state refs) and asserts on getters, state, and mock interactions.
5. Awaits a tick when asserting watcher-driven side effects, since default watchers flush async.
6. Clears persisted keys (localStorage) between tests when the unit hydrates or persists state.

---

## 8. Reference: Naming Decision Table

When naming anything, check this table first:

| Category                | Pattern                               | Example                                                            |
| ----------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| **Boolean ref**         | `is` + Adjective/Noun                 | an open flag like `isModelMenuOpen`                                |
| **Boolean computed**    | `is`/`has`/`should` prefix            | `hasNoModelSelected`, `shouldShowCapabilities`                     |
| **Data ref**            | Descriptive noun                      | `selectedModel`, `attachedFiles`                                   |
| **Collection computed** | Noun + derivation                     | `conversationsSortedByUpdated`                                     |
| **Action function**     | Verb + Noun                           | `changeModel`, `toggleModelMenu`, `createConversation`             |
| **Event handler**       | `on` + Event name                     | `onFileInputChange`, `onDocumentClick`                             |
| **Cleanup function**    | Verb + What + Action                  | `revokeAllObjectUrls`, `closeAllMenus`                             |
| **Formatting helper**   | `format` + What + As                  | `formatContextUsagePercent`                                        |
| **Calculation helper**  | `calc` + What                         | `calcTokenPercent`                                                 |
| **Predicate helper**    | `is`/`has` + What                     | `isConversationExpired`                                            |
| **Component file**      | Noun phrase describing the UI element | `StreamSettingsMenu.vue`, `SubscribedEventItem.vue`                |
| **Composable file**     | `use-` + Domain concept               | `use-blink.ts`, `use-menu-position.ts`                             |
| **Store file**          | Domain concept, setup store           | `left-toolbar.ts` → `useLeftToolbarStore`                          |
| **Helper file**         | Function name + `.helper.ts`          | `strip-html.helper.ts`                                             |
| **Test file**           | Same name + `.spec.ts`                | `strip-html.helper.spec.ts`                                        |
| **Story file**          | Same name + `.stories.ts`             | `ModelSelector.stories.ts`                                         |
