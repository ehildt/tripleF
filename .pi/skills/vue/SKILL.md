---
name: vue
description: Vue component architecture, composable design, helper conventions, testing, and Storybook stories. Use when creating or editing Vue components, composables, pure helper functions, Vitest tests, or Storybook stories.
---

# Vue Component Architecture & Conventions

The full guide with examples and rationale lives in [vue-guide.md](vue-guide.md). This file is the quick reference — use it to check rules before committing.

## Quick Rules

1. **Names express intent.** Every variable, function, component, and file name must answer "what does this do?" on its own. No abbreviations, no vague containers.
2. **Components are presentational:** props in, events out. Store access belongs in composables or the orchestrator, not inside leaf components.
3. **Composables own stateful logic.** Every `ref`, `computed`, `watch`, and store call moves into a composable with an intentional name. **Complex components, orchestrators, and widgets** have a co-located `.spec.ts`; pure presentational components are covered by their story.
4. **One pure function per `.helper.ts` file.** Each helper lives in its own file named after the function, inside a `helpers/` folder co-located with its consumer, and every helper **must** have a co-located `.helper.spec.ts` test file. Composables with non-trivial logic also need a `.spec.ts`; trivial wrappers around tested helpers can skip.
5. **Every component gets a `.stories.ts`** file for Storybook alongside it.
6. **Scoped CSS with `var()` tokens.** Follow the [CSS skill](../css/SKILL.md) for all styling.
7. **One feature per file.** A composable does one thing. A component renders one concern. A helper file contains exactly one exported function.
8. **Co-locate related code.** Composables, helpers, tests, and stories that serve a single component group live next to that group — not in a global `composables/` directory. Only shared composables that are used across the codebase belong in `src/composables/`.
9. **Each orchestrator gets its own folder.** The orchestrator component (e.g., `ChatToolbar.vue`) lives inside the folder that contains its sub-components, composables, helpers, and stories.
10. **Each component gets its own folder.** Sub-components live inside their parent's folder. Shared resources go in `shared/` with sub-folders: `shared/ui/`, `shared/composables/`, `shared/helpers/`.
11. **The parent folder name describes the orchestrator's purpose.** A folder named `chat/exchange/` is wrong — rename to `chat/exchange-list/` so the name matches the orchestrator and follows the kebab-case pattern of sibling folders (`pending-indicator/`, `session-header/`, `toolbar/`).
12. **Every component group has a main orchestrator in the root.** The main component that wires the group together lives as a sibling of the sub-component folders, not inside one of them. The parent folder's name is the kebab-case form of the main orchestrator's name (e.g. `chat/Chat.vue`, `dlq/Dlq.vue`).
13. **Don't write wrapper functions that rename a field or delegate to a single call.** A function earns its name only if the call site can't already see what it does — branching, default values, side effects, or a meaningful re-shape of the input. Pure rename-wrappers like `function isResultRead(r) { return store.isRead(r.id) }` add indirection without information. Either inline the call at the use site (`store.isRead(r.id)`) or replace the wrapper with a real abstraction (a named `computed`, a Set/Map binding, a `.helper.ts` predicate with its own tests). If you need a _name_ for the result, name the _binding_ — not a one-line function around it.
14. **Never add barrel files (re-export-only `index.ts`).** Import directly from the file that defines the symbol. A barrel hides where a symbol lives, makes refactors brittle, and is not needed for tree-shaking. The path is the file. See [vue-guide.md §3b](./vue-guide.md#3b-no-barrel-files).
15. **Props types live in a co-located `.types.ts` file.** No inline `defineProps<{ ... }>()` — extract to a named `XxxProps` interface with JSDoc on each field, in `Xxx.types.ts` next to the component. Composables that derive the component's data import the same props type instead of re-declaring a subset. See [vue-guide.md §1](./vue-guide.md#1-components-presentational-props-in-events-out).
16. **The orchestrator is thin; template sections become components.** The orchestrator's `<script setup>` is props + store calls that wire child config + one data composable call + template. Every `ref`/`computed`/`watch`/function moves into the composable. Each distinct template block (header, callout, list, panels) becomes a presentational sub-component in its own folder with a story; the orchestrator owns the visibility `v-if`s. See [vue-guide.md §5](./vue-guide.md#5-the-orchestrator-pattern).

## Folder rules (one-liners)

- **Each component group has a main orchestrator in the root.** The main component (`Chat.vue`, `Dlq.vue`, …) lives in the group folder and orchestrates the sub-component folders. The group folder name is the kebab-case of the main orchestrator's name.
- **Each component gets its own folder**, even simple shared ones (`shared/ui/icon-button/`).
- **Sub-components live inside their parent's folder** (`SessionItem` → `session-list/session-item/`).
- **Shared resources go in `shared/`** with `ui/`, `composables/`, `helpers/` sub-folders. If only UI, name it `ui/` not `shared/`.
- **Composables in `composables/` folders**, parallel to `helpers/`. Local composables next to their consumer; `shared/composables/` only for composables used by multiple sub-components.
- **Helpers in `helpers/` folders**, one function per file. Local helpers next to consumer; shared helpers in `shared/helpers/` at the component group level.

## Co-location rule

A file belongs **next to its consumer** (in the component group directory) unless it is **shared across the codebase**. Shared means "imported from more than one unrelated area." See vue-guide.md for the full tree.

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
- [ ] No one-line wrapper function exists that just renames a field or delegates to a single call (rule 13)
- [ ] Complex components, orchestrators, and widgets have a `.spec.ts`; pure presentational components are covered by their story
- [ ] Composables with non-trivial logic have a co-located `.spec.ts`; trivial wrappers can skip
- [ ] Every `.helper.ts` has a co-located `.helper.spec.ts`
- [ ] Every component has a `.stories.ts` file
- [ ] CSS uses `var()` tokens, no hardcoded colors, no `@apply`, BEM-style class names
- [ ] No logic in templates that belongs in script — format data in helpers or computeds
- [ ] `defineExpose` in the orchestrator is stable (parent consumers don't break when internal names change)
- [ ] Every component group has a main orchestrator in the root (the group's `Chat.vue` / `Dlq.vue` / …)
- [ ] The parent folder's name is the kebab-case form of the main orchestrator's name
- [ ] No new `index.ts` barrel files were added; imports go directly to the file that defines the symbol
- [ ] Props are typed via a co-located `Xxx.types.ts` — no inline `defineProps<{ ... }>()` types
- [ ] The orchestrator's script is thin: props type + store wiring + one data composable call
- [ ] Distinct template blocks are presentational sub-components with their own folder + story; the orchestrator owns the visibility `v-if`s
- [ ] Toast copy follows the style guide above: friendly i18n text for users, technical details only via `toast.debug`
