---
name: vue
description: Vue component architecture, composable design, helper conventions, testing, and Storybook stories. Use when creating or editing Vue components, composables, pure helper functions, Vitest tests, or Storybook stories.
---

# Vue Component Architecture & Conventions

The full guide with rules and rationale lives in [vue-guide.md](vue-guide.md). This file is the quick reference — use it to check rules before committing.

Generic structural rules that hold across frameworks — names express intent, one function per file, co-located explicit types, role suffixes, co-location, no barrels, no wrapper functions — are canonically defined in the [code-structure](../code-structure/SKILL.md) skill; this skill states their Vue-specific form and refinements alongside. Where wording overlaps, code-structure is canonical. Creating or updating `.spec.ts` and `.stories.ts` files requires explicit user consent (`.pi/APPEND_SYSTEM.md` § Tests, Stories & Browser Automation); the rules below describe the shape of those files when they exist.

## Quick Rules

1. **Names express intent.** Every variable, function, component, and file name must answer "what does this do?" on its own. No abbreviations, no vague containers.
2. **Components are presentational:** props in, events out. Store access belongs in composables or the orchestrator, not inside leaf components.
3. **Composables own component-scoped stateful logic.** Every `ref`, `computed`, `watch`, and store call that is scoped to one component tree moves into a composable with an intentional name. **Shared data surfaces through an orchestrator-owned composable passed to leaves as props; a store is a deliberate exception (rule 18).** **Complex components, orchestrators, and widgets** have a co-located `.spec.ts`; pure presentational leaves are covered transitively by their parent's spec.
4. **One pure function per `.helper.ts` file.** Each helper lives in its own file named after the function, inside a `helpers/` folder co-located with its consumer, and every helper **must** have a co-located `.helper.spec.ts` test file. Composables with non-trivial logic also need a `.spec.ts`; trivial wrappers around tested helpers can skip.
5. **Stories for orchestrators and stateful widgets only.** Orchestrators and interactive widgets get a `.stories.ts` — their visual states are the documentation. Leaf components don't get stories: a leaf that owns interaction logic gets a `.spec.ts`; a pure-markup leaf is covered transitively by its parent's spec. Per-leaf stories only bloat Storybook.
6. **Scoped CSS with `var()` tokens.** Follow the [CSS skill](../css/SKILL.md) for all styling.
7. **One feature per file.** A composable does one thing. A component renders one concern. A helper file contains exactly one exported function.
8. **Co-locate related code.** Composables, helpers, tests, and stories that serve a single component group live next to that group — not in a global `composables/` directory. Only shared composables that are used across the codebase belong in `src/composables/`.
9. **Each orchestrator gets its own folder.** The orchestrator component (e.g., `ChatLeftToolbar.vue`) lives inside the folder that contains its sub-components, composables, helpers, and stories.
10. **Each component gets its own folder.** Sub-components live inside their parent's folder. Shared resources go in `shared/` with sub-folders: `shared/ui/`, `shared/composables/`, `shared/helpers/`.
11. **The parent folder name describes the orchestrator's purpose.** A folder named `chat/exchange/` is wrong — rename to `chat/exchange-list/` so the name matches the orchestrator and follows the kebab-case pattern of sibling folders (`pending-indicator/`, `session-header/`, `chat-left-toolbar/`).
12. **Every component group has a main orchestrator in the root.** The main component that wires the group together lives as a sibling of the sub-component folders, not inside one of them. The parent folder's name is the kebab-case form of the main orchestrator's name (e.g. `chat/Chat.vue`, `dlq/Dlq.vue`).
13. **Don't write wrapper functions that rename a field or delegate to a single call.** A function earns its name only if the call site can't already see what it does — branching, default values, side effects, or domain meaning used in 3+ places. Pure rename-wrappers like `function isResultRead(r) { return store.isRead(r.id) }` add indirection without information. Either inline the call at the use site (`store.isRead(r.id)`) or replace the wrapper with a real abstraction (a named `computed`, a Set/Map binding, a `.helper.ts` predicate with its own tests). If you need a _name_ for the result, name the _binding_ — not a one-line function around it.

   Refinements:
   - **Coercion/reshape alone doesn't earn a name.** `function formatCtxValue(v) { return formatCtx(Number(v)) }` still gets inlined — the call site already says what it does.
   - **Dependency injection earns a name.** A higher-order component/function that imports a store or composable and passes only the derived props a leaf needs is not a rename-wrapper — it decouples the leaf from the store/composable. Keep it.
   - **Thin setters use `v-model`.** Replace `function onX(v) { x.value = v }` + `@update:x="onX"` with `v-model="x"`; keep a manual `@update:*` handler only when the update does real work (clamping, side effects).
   - **Value-sync leaves use `v-model` via `defineModel`.** A leaf wrapping a single native input, textarea, or select exposes its value through `v-model`, declared with the `defineModel` macro and bound straight to the native element — no parallel `value` prop plus `input` emit pair. The smell this bans: an input or change emit whose payload is the browser's event object so the consumer can read the element's value off it — a `v-model` in disguise that forces every consumer to know the element's DOM shape. Interaction events carrying semantic intent (a keydown the consumer branches on, a focus that triggers a side effect) are unaffected.
14. **Never add barrel files (re-export-only `index.ts`).** Import directly from the file that defines the symbol. A barrel hides where a symbol lives, makes refactors brittle, and is not needed for tree-shaking. The path is the file. See [vue-guide.md §3b](./vue-guide.md#3b-no-barrel-files).
15. **Props types live in a co-located `.types.ts` file.** No inline `defineProps<{ ... }>()` — extract to a named `XxxProps` interface with JSDoc on each field, in `Xxx.types.ts` next to the component. Composables that derive the component's data import the same props type instead of re-declaring a subset. See [vue-guide.md §1](./vue-guide.md#1-components-presentational-props-in-events-out).
16. **The orchestrator is thin; template sections become components.** The orchestrator's `<script setup>` is props + store calls that wire child config + the domain composables it binds from (one call per concern) + template. Every `ref`/`computed`/`watch`/function moves into the composable. Each distinct template block (header, callout, list, panels) becomes a presentational sub-component in its own folder (no leaf story); the orchestrator owns the visibility `v-if`s. See [vue-guide.md §5](./vue-guide.md#5-the-orchestrator-pattern).
17. **Renaming is all-or-nothing.** When a component or a component-group folder is renamed, update the whole set in one pass: the component `.vue`, its co-located `.types.ts`/`.stories.ts`/`.spec.ts`, the scoped BEM block prefix (see the [CSS skill](../css/SKILL.md)), the Storybook `title`, every import and usage, and any `data-*` attributes or prose comments that name it. Finish by grepping the old identifier across `src` and confirming zero hits — no stale names left behind.
18. **Components stay isolated by default; a store is a deliberate exception — and it never controls components.** Shared data surfaces through a composable owned by the orchestrator and passed to leaves as props; leaves never reach into a global store. A Pinia store is introduced only as an explicit decision when data genuinely has to route across many components and prop-passing would couple them worse — opt-in, never the blanket answer to "shared state". A chosen store holds only reactive data plus the actions that mutate it: never a component instance, a template ref, or a component's imperative methods, and no store action ever commands a component (calling `play` or `pause` on a mounted player, forcing focus or scroll into a child). Components react to data. Anti-patterns that this rule exists to prevent:

    - a store adopted by default for data the orchestrator's composable could own and hand down as props;
    - a store that holds a component handle and invokes it from an action;
    - a bespoke `provide`/`inject` context that shuttles shared mutable state to children (hidden dependencies, no compile-time guarantee);
    - a composable that mirrors a store value into its own local `ref` and syncs it back with a `watch` (dual source of truth);
    - a hand-rolled `*.state.ts` module that holds exported `ref`/`shallowRef` maps (a store without actions/getters/spec).

    Never `provide`/`inject` — the ban covers app-level service singletons too (rule 21). Orchestrators read stores (when one is deliberately introduced) and pass plain props down to leaves.

19. **Composables compose by import; nothing is relayed through the component.** When a composable needs a store, a helper, a service facade, or another composable, it imports and calls that unit itself — the wrapper-composable pattern. The component's `<script setup>` calls the composables it binds from; it never destructures one composable's outputs just to forward them as arguments into a sibling composable. Composable parameters are reserved for inputs that genuinely vary per call site — singletons, services, and shared state are resolved by the composable itself. Dependency direction is strictly toward the local: a shared composable (top-level `composables/`, a group's `shared/composables/`) never imports feature-local code; a composable with feature-local dependencies lives in that feature's `composables/` folder instead of taking the feature's values as arguments.

   **A composable's return never re-publishes another unit's members unchanged.** Destructuring an imported composable, store, or service facade only to include its refs and functions in your own return — verbatim or renamed — is a proxy barrel: the consumer now reaches every symbol through a middle layer that hides where it lives and duplicates the source's API surface, so every source change must be mirrored in the proxy. Members the consumer needs are bound at the consumer by importing the source unit directly; module-scope singletons (rule 20) make direct binding safe from any number of call sites. A composable's return earns a member only by owning it, deriving it, or composing it into new behavior — a delegate that combines several dependencies' members into one action with new meaning, such as act-then-close or select-view-then-open. A renamed store-method alias in a return is the same relay one level down and is bound directly by the orchestrator (rule 18).

   One sanctioned exception: when a composable creates a per-caller service instance that its own logic must stay wired to — a lightbox whose current image feeds an add-to-files derivation, a chart engine built from internal refs — the consumer cannot bind the source directly without a second, diverging instance. Expose that instance under one namespaced key, the delegation object, and let the consumer reach into it; never flatten its members into per-key re-exports.
20. **Shared composable state lives at module scope of its composable file.** The default stays state created in the function body, fresh per caller. When the state is semantically a singleton — one prompt draft for the chat view no matter which caller asks — declare the `ref`/`reactive` at module scope and return the same instance with its actions from every call. Document the singleton nature in the file's JSDoc and give its specs a reset step between tests. This is the sanctioned exception to rule 18's stray-state-module anti-pattern: state hoisted inside its owning composable and exposed only through the composable's own API is still a composable; bare exported ref maps in a dedicated state drawer file remain banned.
21. **No `provide`/`inject` — anywhere, for anything.** It hides dependencies behind a runtime key with no compile-time guarantee a provider exists, and it forces components to do dependency plumbing for their composables. Shared UI state follows rule 18's ladder (orchestrator-owned composable plus props, else a deliberate store). Services and app singletons resolve the same way everything else in a composable does — by import: a dedicated composable calls the stores and the plain assembler helper and returns the facade, and any composable that needs the service calls that composable. No app-root provide, no injection key, no relay. Pre-existing provide/inject wiring is migrated away as it is touched, never extended.

## Folder rules (one-liners)

- **Each component group has a main orchestrator in the root.** The main component (`Chat.vue`, `Dlq.vue`, …) lives in the group folder and orchestrates the sub-component folders. The group folder name is the kebab-case of the main orchestrator's name.
- **Each component gets its own folder**, even simple shared ones (`shared/ui/icon-button/`).
- **Sub-components live inside their parent's folder** (`SessionItem` → `session-list/session-item/`).
- **Shared resources go in `shared/`** with `ui/`, `composables/`, `helpers/` sub-folders. If only UI, name it `ui/` not `shared/`.
- **Composables in `composables/` folders**, parallel to `helpers/`. Local composables next to their consumer; `shared/composables/` only for composables used by multiple sub-components.
- **Helpers in `helpers/` folders**, one function per file. Local helpers next to consumer; shared helpers in `shared/helpers/` at the component group level.
- **Dropdown menus split into orchestrator + `XxxTrigger`.** The trigger owns the anchor `ref`, `useMenuPosition`, the `Teleport`, and a default slot for the menu body; it also renders a fixed transparent `{menu}__backdrop` that emits `close`, so the menu self-closes on an outside click (the slide-over/lightbox pattern) instead of a coordinator-level `onClickOutside` with `[data-*]` ignore selectors.

## Co-location rule

A file belongs **next to its consumer** (in the component group directory) unless it is **shared across the codebase**. Shared means "imported from more than one unrelated area." See vue-guide.md for the full folder structure rules.

## Naming

See the [Reference: Naming Decision Table](vue-guide.md#8-reference-naming-decision-table) in the guide.

## Toast copy style guide

Toast messages live in `i18n/locales/en.ts` under `toast:` (schema in
`locale-schema.ts`). Keep them user-friendly:

- **Outcome first, plain words.** Say what happened and what the user can do:
  "Couldn't save the API key". No jargon ("socket", "payload" internals) in
  user-facing severities; match the verb of the button that triggered it
  (Archive → "Job archived").
- **Success/confirmations:** short `{Noun} {past-participle}` — "Payload saved",
  "Queue saved". Never "successfully".
- **Errors:** `Couldn't …` + a recovery hint when one exists ("Try again in a
  moment"). One sentence → no trailing period; two sentences → periods.
- **Technical details are `debug` only.** HTTP bodies, `error.message`, and
  stack text go to `toast.debug(...)` (or `console.error`); the user-facing
  toast gets the friendly i18n string. Never interpolate raw error text into
  `error`/`warning` toasts.
- **Reuse keys for recurring situations** (e.g. `toast.requestError`,
  `toast.contextClamped`) instead of adding a near-duplicate variant.
- **Mutable warnings carry a `key`.** Recurring capability/limit warnings
  ("model can't see images", "context clamped") pass a key from
  `composables/toast-keys.ts` so the toast shows the "Don't show this message
  again" action; muted kinds are skipped in `toast-state.add()`. Errors stay
  un-muted — failures must remain visible.

## Checklist

The Quick Rules and Folder Rules above are the source of truth. Use this checklist to verify a finished task at a glance:

- [ ] Every name answers "what does this do?" without context
- [ ] No component makes a store call directly (except the orchestrator, which wires composables)
- [ ] No ref, computed, watch, or store call lives in a leaf component's `<script setup>`
- [ ] No pure-delegation wrapper function exists (rule 13); thin ref-setters are `v-model`, not `@update:*` handlers
- [ ] Complex components, orchestrators, and widgets have a `.spec.ts` + `.stories.ts`; leaves get a `.spec.ts` when they own logic, else covered by the parent's spec
- [ ] Composables with non-trivial logic have a co-located `.spec.ts`; trivial wrappers can skip
- [ ] Every `.helper.ts` has a co-located `.helper.spec.ts`
- [ ] Helpers return i18n keys and params — the caller translates; no helper receives or imports the translate function
- [ ] Orchestrators and stateful widgets have a `.stories.ts`; leaf components don't
- [ ] CSS uses `var()` tokens, no hardcoded colors, no `@apply`, BEM-style class names
- [ ] No logic in templates that belongs in script — format data in helpers or computeds
- [ ] Components stay isolated — shared data surfaces via an orchestrator's composable as props; a store is a deliberate exception, never the default (rule 18)
- [ ] Any chosen store shares data and never controls components — no component handles, no imperative calls into components (rule 18)
- [ ] No composable receives another composable's outputs forwarded by the component — it imports its own dependencies (rule 19)
- [ ] No composable return re-publishes members of an imported composable or store, flattened or renamed — consumers bind the source directly; a privately-created per-caller service instance is exposed once as a namespaced delegation key (rule 19)
- [ ] Shared composable state is module-scope in its composable file and documented as a singleton (rule 20)
- [ ] No `provide`/`inject` anywhere — no injection keys, no app-root service provides (rule 21)
- [ ] A composable never mirrors a store value into a local `ref`
- [ ] Menus/dropdowns self-close via a fixed transparent `{menu}__backdrop` with a `close` emit — no coordinator-level `onClickOutside` + `[data-*]` ignore list
- [ ] No `defineExpose` for shared state — consumers read the store (or receive props) directly; `defineExpose` only exposes genuine imperative DOM handles (element refs the parent must own, e.g. a scrollable list), named identically to their variables
- [ ] Every component group has a main orchestrator in the root (the group's `Chat.vue` / `Dlq.vue` / …)
- [ ] The parent folder's name is the kebab-case form of the main orchestrator's name
- [ ] No new `index.ts` barrel files were added; imports go directly to the file that defines the symbol
- [ ] Props are typed via a co-located `Xxx.types.ts` — no inline `defineProps<{ ... }>()` types
- [ ] The orchestrator's script is thin: props type + store wiring + one data composable call
- [ ] No component is a relay: its props don't mirror the parent's composable returns, no event it emits forwards a received payload unchanged, and no prop is passed without ever being rendered
- [ ] Distinct template blocks are presentational sub-components with their own folder (no leaf stories); the orchestrator owns the visibility `v-if`s
- [ ] Toast copy follows the style guide above: friendly i18n text for users, technical details only via `toast.debug`
- [ ] A rename updated the whole set (component + `.types.ts`/`.stories.ts`/`.spec.ts` + BEM block prefix + story title + all imports/comments/attributes); a global grep for the old identifier is empty
