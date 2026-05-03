# Vue Component Architecture Guide

This guide defines how we write Vue components, composables, helpers, tests, and stories. Every convention exists so that code reads as English — a future reader should understand intent from names alone.

For the quick rule-of-thumb reference, see [SKILL.md](./SKILL.md).

## How to use this guide

Read sections in order on your first pass. When working, jump straight to the section that matches what you're writing:

- **Adding a component or sub-component?** → Section 1 (Components) + Section 5 (Orchestrator Pattern)
- **Adding a composable?** → Section 2 (Composables)
- **Adding a helper?** → Section 3 (Pure Helpers)
- **Considering a one-line wrapper function?** → Section 3a (Don't Write Wrapper Functions)
- **Considering a barrel file (`index.ts`)?** → Section 3b (No Barrel Files)
- **Adding a Storybook story?** → Section 4 (Stories)
- **Adding a test?** → Section 6 (Component Testing) + Section 7 (Composable Testing)
- **Naming something?** → Section 8 (Reference: Naming Decision Table)
- **Reviewing work?** → the Checklist in [SKILL.md](./SKILL.md)
- **Setting up a new component group?** → Section 9 (Component Group Layout)

---

## 1. Components: Presentational, Props-In Events-Out

A component renders UI. It receives data through props and communicates user actions through events. It does **not** access Pinia stores, mutate global state, or manage business logic.

### File naming

Components are PascalCase, in their own subdirectory. See the [folder structure in section 2](#2-composables-stateful-logic-extraction) for the full tree.

```
session-list/
├── SessionList.vue
├── SessionList.stories.ts
├── helpers/
├── session-item/
│   ├── SessionItem.vue
│   └── SessionItem.stories.ts
```

### Component structure

Order inside `<script setup lang="ts">`:

1. Imports (Vue, external, internal)
2. `defineProps` / `defineEmits` — the contract
3. Computed values derived from props
4. Template refs

```vue
<script setup lang="ts">
import { computed } from "vue";
import type { OllamaModel } from "../../../stores/models";

const props = defineProps<{
  models: readonly OllamaModel[];
  selectedModelName: string;
  isLoading: boolean;
}>();

const emit = defineEmits<{
  selectModel: [modelName: string];
  toggleMenu: [];
}>();

const selectedIndex = computed(() =>
  props.models.findIndex((m) => m.model === props.selectedModelName),
);
</script>
```

For the full naming conventions on props (`isOpen` not `showMenu`, `selectModel` not `select`), see [Section 8: Reference: Naming Decision Table](#8-reference-naming-decision-table). Naming is documented once, not repeated per section.

### Templates and scoped styles

- Use BEM-style class names for scoped styles.
- Format data in helpers or computeds — no complex logic in templates.
- For CSS: use `var()` tokens, BEM class names, real CSS pseudo-classes for state. Follow the [CSS skill](../css/SKILL.md).

---

## 2. Composables: Stateful Logic Extraction

A composable encapsulates reactive state, watchers, and store interactions. It owns the "how" — the component only knows the "what" through the composable's return value.

### File naming and location

Composables are named with `use-` prefix, describing **what they manage** (not where they're used). See the [naming table](#8-reference-naming-decision-table) for the full pattern.

**Co-location rule:** A composable lives **next to the component(s) it serves** unless it is shared across the codebase. The test: **is this composable imported from more than one unrelated area?** If not, it belongs next to its consumers.

```
src/components/chat/                              ← main group folder, named after Chat.vue
├── Chat.vue                                      ← main orchestrator (in the root)
├── Chat.stories.ts
├── Chat.spec.ts
├── composables/                                  ← composables local to the chat root
│   ├── use-action-bar.ts
│   └── use-chat-context-size.ts
├── helpers/                                      ← per-function helpers in their own folder
├── toolbar/                                      ← sub-component folder, named after its orchestrator
│   ├── ChatToolbar.vue                           ← sub-orchestrator, in its folder's root
│   ├── ChatToolbar.spec.ts
│   ├── ChatToolbar.stories.ts
│   ├── shared/                                   ← shared resources inside this sub-group
│   │   ├── ui/
│   │   └── composables/
│   │       ├── use-selected-model.ts
│   │       └── use-event-subscriptions.ts
│   ├── model-selector/
│   │   ├── ModelSelector.vue
│   │   └── model-list/                          ← sub-component of ModelSelector
│   │       └── ModelList.vue
│   └── session-list/
│       ├── SessionList.vue
│       └── session-item/                        ← sub-component of SessionList
│           └── SessionItem.vue
├── exchange-list/                                ← another sub-group
│   ├── ChatExchangeList.vue
│   └── …
├── session-header/                               ← leaf sub-component
└── shared/                                       ← resources shared across the whole chat group
    └── helpers/
        └── calc-token-percent.helper.ts

src/composables/                                 ← only composables shared across the codebase
├── use-blink.ts
├── use-toast.ts
└── use-local-storage-sync.ts
```

### Folder structure rules

- **Each component group has a main orchestrator in the root.** A group folder (e.g. `chat/`) has exactly one main orchestrator (e.g. `Chat.vue`) as a sibling of the sub-component folders. See [Section 5: Every group has a main orchestrator](#every-group-has-a-main-orchestrator-in-the-root).
- **Each component gets its own folder.** Even simple ones like `IconButton` get `shared/ui/icon-button/`.
- **Sub-components live inside their parent's folder.**
- **The parent folder name matches the orchestrator's name (kebab-case).** `Chat.vue` lives in `chat/`, not in `chat/sections/`. A folder containing `ChatExchangeList.vue` is named `exchange-list/`, not `exchange/` or `exchanges/`.
- **Shared resources go in `shared/`.** If only UI, name it `ui/`. `shared/` is for _all_ shared things.
- **Helpers go in `helpers/` folders, one function per file.** Local helpers next to their consumer; shared helpers in `shared/helpers/` at the component group level. No loose helper files.
- **Composables go in `composables/` folders, parallel to `helpers/`.** `shared/composables/` is reserved for composables used by multiple sub-components.

### Composable structure

```ts
// 1. Imports (paths relative to the component group)
import { computed, ref, watch } from "vue";
import { useModelsStore } from "../../../stores/models";
import { useToast } from "../../../composables/use-toast";

// 2. Constants (localStorage keys, etc.)
const LOCAL_STORAGE_SELECTED_MODEL_KEY = "vision-selected-model";

// 3. Exported function
export function useSelectedModel() {
  // 3a. Store instances
  const modelsStore = useModelsStore();
  const toast = useToast();

  // 3b. Reactive state
  const selectedModel = ref(
    localStorage.getItem(LOCAL_STORAGE_SELECTED_MODEL_KEY) || "",
  );

  // 3c. Computed values
  const isModelAvailable = computed(() => {
    /* ... */
  });

  // 3d. Watchers
  watch(/* ... */);

  // 3e. Functions
  function changeModel(modelName: string) {
    /* ... */
  }

  // 3f. Return — the public API
  return { selectedModel, isModelAvailable, changeModel };
}
```

### Composables call stores directly

Composables access Pinia stores directly — they are the bridge between stores and components. Components never call stores directly (unless it's the orchestrator component wiring composables together).

### No `provide`/`inject` inside composables

`provide` and `inject` belong in the orchestrator component. Composables return values; the orchestrator decides what to `provide` to the tree.

---

## 3. Pure Helpers: One Function Per File, in `helpers/` Folders

### One helper function per file

Each helper function lives in its own `.helper.ts` file, named after the function. A helper file exports exactly one named function. This makes imports self-documenting and prevents "util drawer" files.

### What goes in a helper

Any function that:

- Takes input, returns output
- Has no side effects (no refs, no store calls, no DOM)
- Would otherwise be inlined in a `<script setup>` or computed

### File naming and location

Helpers go in a `helpers/` folder co-located with their consumers — one function per file, never loose at the root of a component group:

```
exchange-list/                          ← parent folder, named after its orchestrator
├── ChatExchangeList.vue
├── ChatExchangeList.stories.ts
├── ChatExchangeList.spec.ts
└── chat-exchange/                       ← sub-orchestrator's own folder
    ├── ChatExchange.vue
    ├── ChatExchange.stories.ts
    ├── composables/                     ← composables local to ChatExchange
    ├── helpers/                         ← helpers in their own folder
    │   ├── strip-html.helper.ts         ← one function per file
    │   ├── strip-html.helper.spec.ts    ← co-located spec
    │   ├── truncate-text.helper.ts
    │   └── truncate-text.helper.spec.ts
    ├── exchange-collapsed/
    └── exchange-content/
```

**The parent folder name describes the orchestrator's purpose.** A folder containing `ChatExchangeList.vue` is named `exchange-list/`, not `exchange/` or `exchanges/`. This matches the naming pattern of other group folders (`pending-indicator/`, `session-header/`, `toolbar/`).

**A sub-orchestrator gets its own folder** by the same rule that says sub-components live inside their parent's folder. So `ChatExchange.vue` (used by `ChatExchangeList.vue`) lives in `exchange-list/chat-exchange/`, not loose at the root of `exchange-list/`.

**Shared helpers** go in `shared/helpers/` at the component group level (e.g., `chat/shared/helpers/calc-token-percent.helper.ts`).

### Helper naming

Files are named after the function: `strip-html.helper.ts` exports `stripHtml`. Functions describe **what they compute or format**, using a verb prefix. See the [naming table](#8-reference-naming-decision-table) for the full pattern (`formatContextUsagePercent`, `calcTokenPercent`, `isSessionExpired`, `stripHtml`, `parseSocketBinding`, etc.).

### Every helper must have a spec

Co-located test file with the same name plus `.spec.ts`, in the same `helpers/` folder. Example:

```ts
// strip-html.helper.ts
export function stripHtml(html: string): string {
  const el = document.createElement("div");
  el.innerHTML = html;
  return el.textContent ?? "";
}
```

```ts
// strip-html.helper.spec.ts
import { describe, expect, it } from "vitest";
import { stripHtml } from "./strip-html.helper";

describe("stripHtml", () => {
  it("strips HTML tags", () => {
    expect(stripHtml("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });
  it("returns plain text unchanged", () => {
    expect(stripHtml("plain text")).toBe("plain text");
  });
  it("handles empty string", () => {
    expect(stripHtml("")).toBe("");
  });
});
```

---

## 3a. Don't Write Wrapper Functions

A function earns its name only if the call site can't already see what it does. A wrapper that just renames a field or delegates to a single call is indirection without information.

### The pattern to avoid

```ts
// ❌ isResultRead is a synonym for store.isDebugRead + .id
function isResultRead(result: DebugResult) {
  return debugStore.isDebugRead(result.id);
}

// call sites
results.filter((r) => !isResultRead(r));
sort((a, b) => Number(isResultRead(a)) - Number(isResultRead(b)));
```

Every call site says `isResultRead` but reads `isResultRead(result)`. The reader has to jump to the function to learn that "Result" reduces to `result.id`. The function name _isn't telling them anything new_ — it's just hiding the call to the store behind a verb.

### Three legitimate alternatives

Pick one based on what would actually help a reader:

**1. Inline the call when no name is needed.**

```ts
results.filter((r) => !debugStore.isDebugRead(r.id));
sort(
  (a, b) =>
    Number(debugStore.isDebugRead(a.id)) - Number(debugStore.isDebugRead(b.id)),
);
```

The call site is one line longer but self-contained. The store's name `isDebugRead` already says what it does. No wrapper, no indirection, and a reader who hasn't seen the store yet still knows this is a "read" check.

**2. Name the _binding_, not a one-line function around it.**

If the call site genuinely needs a name (because the value is reused, or to communicate domain intent), name the _value_ the name belongs to — a `Set`, a `computed`, a ref — not a function around a single field.

```ts
// The reader sees a named Set; the wrapper is gone.
const readResultIds = computed(
  () =>
    new Set(
      props.results
        .filter((r) => debugStore.isDebugRead(r.id))
        .map((r) => r.id),
    ),
);

results.filter((r) => !readResultIds.value.has(r.id));
```

**3. Promote it to a real predicate in a `.helper.ts` file.**

If the wrapper exists in many places and the predicate is part of the domain, give it its own file with its own tests. Then it is a _named function_ by the rules of [Section 3](#3-pure-helpers-one-function-per-file-in-helpers-folders), not a local indirection:

```ts
// debug/request-details/helpers/has-read-result.helper.ts
export function hasReadResult(result: DebugResult): boolean {
  return debugStore.isDebugRead(result.id);
}
```

### How to decide

| You see…                                                                | Then…                                                            |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------- |
| A wrapper that just calls `store.isX(r.id)` or `props.x.has(r.id)`      | **Inline it.** The call site is already clear.                   |
| A wrapper used 3+ times in the same file with the _same argument shape_ | **Name the result** (a `Set`, a `computed`) — see option 2.      |
| A wrapper used across many files, with a domain meaning                 | **Promote it to a `.helper.ts` predicate** with its own spec.    |
| A wrapper that branches, supplies defaults, or reshapes its input       | **Keep it** — that is real logic.                                |
| A composable's `isX(id)` factory that returns a `computed` per key      | **Keep it** — the factory creates reactive state, not a synonym. |

### Anti-examples to leave alone

These look like wrappers but are not — they do real work, so they stay:

```ts
// Predicates with type narrowing and branching.
function isKnownMenuId(id: string): id is DlqFilterMenuId {
  return (menuIds as readonly string[]).includes(id);
}

// One-liner helpers with their own file and tests.
export function isDlqEntryImmutable(entry: VisionDlq | null): boolean {
  return entry?.status === "Removed";
}

// Composable factories that return a per-key computed.
function isMenuOpen(key: string) {
  return computed(() => openMenuKey.value === key);
}
```

The rule is about removing _redundant_ indirection, not about banning all small functions.

---

## 3b. No Barrel Files

A barrel file is a re-export-only `index.ts` that aggregates imports from sibling files. We never add them. Import directly from the file that defines the symbol.

### The pattern to avoid

```ts
// ✗ src/components/pproc/index.ts  — a barrel file
export { default as PprocMasterToggle } from "./shared/ui/master-toggle/PprocMasterToggle.vue";
export { default as PprocParamTile } from "./shared/ui/param-tile/PprocParamTile.vue";
export { default as PprocSection } from "./shared/ui/section/PprocSection.vue";
export { default as PprocToggleButton } from "./shared/ui/toggle-button/PprocToggleButton.vue";

// ✗ importers pull through the barrel
import {
  PprocMasterToggle,
  PprocSection,
  PprocToggleButton,
} from "../../../pproc";
import { PprocParamTile } from "../../../pproc";
import { PprocToggleButton } from "../../../pproc";
```

A barrel hides where a symbol lives. The reader sees `from "../../../pproc"` and has to open `pproc/index.ts` to find the file. With a direct import, the path _is_ the file:

```ts
// ✓ import directly from the file
import PprocMasterToggle from "../../../pproc/shared/ui/master-toggle/PprocMasterToggle.vue";
import PprocParamTile from "../../../pproc/shared/ui/param-tile/PprocParamTile.vue";
import PprocSection from "../../../pproc/shared/ui/section/PprocSection.vue";
import PprocToggleButton from "../../../pproc/shared/ui/toggle-button/PprocToggleButton.vue";
```

### Why no barrels

- **The path is the file.** A direct import shows exactly where the symbol lives — useful for code search, refactors, and reading the import list at a glance.
- **Renames and moves stay local.** When `PprocSection.vue` moves to `pproc/shared/ui/header/`, only the direct importers change. With a barrel, the barrel also moves or the import still works against a stale path.
- **Tree-shaking is unchanged.** Vite resolves the exact `.vue` file either way; the barrel is not buying bundle size.
- **Barrels grow.** A barrel tends to accrete every export in the folder, including internal helpers and types that should never leak across group boundaries.

### The folder name is the symbol, not `index.ts`

The folder is the unit of co-location. If three siblings in `pproc/shared/ui/` are imported together, the readers see three explicit file paths — that is the _information_ the import is supposed to carry. A barrel turns three explicit paths into one opaque path and asks the reader to chase it.

### What about the existing `inputs/index.ts` and `ui/index.ts`?

Those are pre-existing barrels. They are not an argument to add new ones. New component groups do not get a barrel; new files do not register themselves in an existing barrel. Import directly from the file.

---

## 4. Stories: Visual Documentation for Every Component

Every component gets a story. Story files are co-located with their components. See the [folder structure in section 2](#2-composables-stateful-logic-extraction) for where they live in the tree.

### Story structure

```ts
import { Brain } from "@lucide/vue";
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";

import ModelSelector from "./ModelSelector.vue";

const meta = {
  title: "Chat/Toolbar/ModelSelector",
  component: ModelSelector,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `
Dropdown for selecting the active model. Shows a brain icon button that
opens the model list. Disabled when no model is selected.
`,
      },
    },
  },
  argTypes: {
    isOpen: { control: "boolean" },
    selectedModelName: { control: "text" },
    isLoading: { control: "boolean" },
  },
  args: {
    isOpen: false,
    selectedModelName: "",
    isLoading: false,
    onToggleMenu: fn(),
    onSelectModel: fn(),
  },
} satisfies Meta<typeof ModelSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default closed state. */
export const Closed: Story = {};

/** Open dropdown showing model list. */
export const Open: Story = { args: { isOpen: true } };

/** Loading state. */
export const Loading: Story = { args: { isLoading: true } };
```

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

The top-level component (e.g., `ChatToolbar.vue`) is an **orchestrator**. It:

1. Calls composables to get reactive state and actions
2. Wires composables together (e.g., closing menus when chat deactivates)
3. Manages cross-cutting concerns (outside-click handling, blink providers)
4. Assembles presentational components in the template
5. Re-exposes a stable interface via `defineExpose` for parent components

### What the orchestrator does NOT do

- No inline business logic in `<script setup>` — delegate to composables
- No direct store calls — composables handle that
- No complex computed properties — move to composables or helpers

### The orchestrator lives in its folder

The orchestrator component shares the **same folder** as its sub-components, composables, helpers, and stories. It is NOT a sibling file outside the folder.

```
✗  chat/
    ├── ChatToolbar.vue          ← orchestrator outside its folder
    └── toolbar/
        ├── ModelSelector.vue
        └── ...

✓  chat/toolbar/
    ├── ChatToolbar.vue          ← orchestrator inside its folder
    ├── shared/                  ← shared resources
    ├── session-list/            ← sub-component folder
    │   ├── SessionList.vue
    │   └── session-item/        ← sub-component of SessionList
    │       └── SessionItem.vue
    └── ...
```

This makes the directory structure self-documenting: everything related to the toolbar is in `toolbar/`, including the component that wires it all together.

### Example orchestrator script

```ts
<script setup lang="ts">
import { provide, ref, watch } from 'vue';

import { useBlink } from '../../../composables/use-blink';
import { useExclusiveMenu } from './shared/composables/use-exclusive-menu';
import { useSelectedModel } from './shared/composables/use-selected-model';

import ModelSelector from './model-selector/ModelSelector.vue';
import SessionList from './session-list/SessionList.vue';

const props = defineProps<{ chatActive: boolean }>();

const { isMenuOpen, toggleMenu, closeAllMenus } = useExclusiveMenu([
  'model',
  'newSession',
]);
const { selectedModel, changeModel } = useSelectedModel();

const streamBlink = useBlink(1500);
provide('blinkStream', streamBlink.blink);

watch(() => props.chatActive, (active) => {
  if (!active) closeAllMenus();
});

defineExpose({ selectedModel });
</script>
```

### defineExpose stability

The orchestrator's `defineExpose` must maintain backward compatibility with parent consumers. If internal composable names change, re-export with the old name:

```ts
defineExpose({
  selectedFiles: attachedFiles, // backward compat alias
  fileInputRef,
  handleFileSelect: onFileInputChange, // backward compat alias
  selectedModel,
});
```

Orchestrators are the canonical case for a `.spec.ts` — see [Section 6](#6-component-testing) for the full rule.

### Every group has a main orchestrator in the root

A component group (`chat/`, `dlq/`, `debug/`, …) is more than a bag of sub-component folders. It has **one** main component that wires the sub-components together for the consumer. This main component lives in the **root of the group folder** as a sibling of the sub-component folders, not inside one of them.

The parent's folder name is the kebab-case form of the main orchestrator's name:

| Group folder | Main orchestrator file   | What it wires                              |
| ------------ | ------------------------ | ------------------------------------------ |
| `chat/`      | `Chat.vue`               | toolbar, exchange list, input, right panel |
| `dlq/`       | `Dlq.vue`                | list header, list body, details body       |
| `debug/`     | `Debug.vue` (or similar) | results, filters, health                   |

```
✗  chat/                                          ← group folder
    ├── chat/ChatSection.vue                      ← main component is duplicated
    │   └── chat/sections/ChatSection.vue
    └── chat/exchange-list/, chat/toolbar/, …     ← sub-component folders

✓  chat/
    ├── Chat.vue                                  ← main orchestrator, in the root
    ├── Chat.stories.ts
    ├── Chat.spec.ts
    ├── exchange-list/                            ← sub-component folder
    │   └── ChatExchangeList.vue                  ← sub-orchestrator
    ├── toolbar/                                  ← sub-component folder
    │   └── ChatToolbar.vue                       ← sub-orchestrator
    ├── session-header/                           ← leaf sub-component
    ├── pending-indicator/                        ← leaf sub-component
    └── shared/                                   ← cross-cutting resources
```

**Why the rule matters**

- The folder is self-describing: `chat/` tells you exactly what lives at its top level — the main chat view, alongside its sub-component folders.
- Consumers (`AppMainContent.vue`, the Storybook sidebar, code search) can rely on a single predictable file at the root to find the entry point.
- Sub-orchestrators (`ChatExchangeList.vue`, `ChatToolbar.vue`) keep living in their own sub-folders, because they are the _root of their own group_. The rule composes: each sub-folder is itself a group with a root orchestrator.

**Sub-orchestrators stay in their own folders.** `ChatExchangeList.vue` is the orchestrator of the `exchange-list/` sub-group and stays there — it is not promoted to the chat root just because it is "important". The chat root orchestrator composes it via `<ChatExchangeList :retry-handler="…"/>`. This is the same rule recursively: every sub-folder follows it.

---

## 6. Component Testing

### The principle: test by logic density, not file size

A `.vue` file's complexity is measured by **how much behavior it owns**, not by how many lines it has. A 300-line atom can be a thin wrapper around a composable (skip the test, test the composable). A 17-line `Badge.vue` can be pure markup and styling (skip the test, the story covers it).

**Write a `.spec.ts` when the component owns meaningful behavior:**

- **Orchestrators** — they wire composables, manage cross-cutting concerns, and re-expose a stable interface. The behavior lives in the wiring; the test verifies the wiring holds.
- **Widgets** — interactive controls with internal state: dropdowns with keyboard handling, modals with focus traps, lightboxes with navigation. Even when they are "small atoms," the interaction logic is the component's reason for existing.
- **Any component with non-trivial logic in `<script setup>`** — refs, computeds, watchers, event handlers with branching, conditional rendering driven by complex rules.

**Skip the `.spec.ts` when the component is a thin presentational layer:**

- Pure styled markup driven by props (e.g., a `StatusBadge.vue` that maps a status to a class).
- Components that delegate everything to a single composable — test the composable instead.
- Components that are exercised end-to-end through a story or a parent's test.

### Decision table

| Component shape                                     | Test? | Why                                                                                |
| --------------------------------------------------- | ----- | ---------------------------------------------------------------------------------- |
| Orchestrator (e.g. `ChatToolbar.vue`)               | ✓     | The wiring IS the component's behavior.                                            |
| Widget with state and interaction (e.g. `DropDown`) | ✓     | Keyboard handling, open/close, focus management are its reason for existing.       |
| Component with a meaningful `<script setup>`        | ✓     | Any computed/branching/event logic deserves a test.                                |
| Pure presentational: props → markup/styles          | skip  | A story captures the visual states; any logic is in a tested helper or composable. |
| Leaf that just re-emits parent events               | skip  | Trivial pass-through; tested transitively by the orchestrator's test.              |

**Story coverage is not a substitute for tests.** A `.stories.ts` captures the _visual states_ of a component. It does not assert behavior over time, branch on user input, or verify store interactions. A drop-down's story shows the menu open and closed; a test verifies that pressing `Escape` closes it.

---

## 7. Composable Testing

### When to write composable tests

Not every composable needs a test. Write tests when the composable contains:

- Pure logic mixed into reactive wrappers (extract the pure logic to a helper and test that)
- Complex computed derivations
- Store interaction contracts

Trivial composables that wrap a tested helper can skip the spec.

### Composable test conventions

Tests for **local** composables live co-located with the composable in the component group directory. Tests for **shared** composables stay in `src/composables/` next to the source.

### Example composable test

```ts
import { describe, expect, it } from "vitest";
import { useExclusiveMenu } from "./use-exclusive-menu";

describe("useExclusiveMenu", () => {
  it("starts with all menus closed", () => {
    const { isMenuOpen } = useExclusiveMenu(["model", "stream", "sessions"]);
    expect(isMenuOpen("model").value).toBe(false);
    expect(isMenuOpen("stream").value).toBe(false);
    expect(isMenuOpen("sessions").value).toBe(false);
  });

  it("opens one menu at a time", () => {
    const { isMenuOpen, toggleMenu } = useExclusiveMenu(["model", "stream"]);
    toggleMenu("model");
    expect(isMenuOpen("model").value).toBe(true);
    expect(isMenuOpen("stream").value).toBe(false);
    toggleMenu("stream");
    expect(isMenuOpen("model").value).toBe(false);
    expect(isMenuOpen("stream").value).toBe(true);
  });
});
```

---

## 8. Reference: Naming Decision Table

When naming anything, check this table first:

| Category                | Pattern                               | Example                                                            |
| ----------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| **Boolean ref**         | `is` + Adjective/Noun                 | `isModelMenuOpen`, `isStreamEnabled`, `isSubscriptionListExpanded` |
| **Boolean computed**    | `is`/`has`/`should` prefix            | `hasNoModelSelected`, `isModelAvailable`, `shouldShowCapabilities` |
| **Data ref**            | Descriptive noun                      | `selectedModel`, `newSessionName`, `attachedFiles`                 |
| **Collection computed** | Noun + derivation                     | `sessionsSortedByUpdated`, `availableSocketBindings`               |
| **Action function**     | Verb + Noun                           | `changeModel`, `createNewSession`, `toggleModelMenu`               |
| **Event handler**       | `on` + Event name                     | `onFileInputChange`, `onDocumentClick`                             |
| **Cleanup function**    | Verb + What + Action                  | `revokeAllObjectUrls`, `closeAllMenus`                             |
| **Formatting helper**   | `format` + What + As                  | `formatContextUsagePercent`, `formatSessionExpiry`                 |
| **Calculation helper**  | `calc` + What                         | `calcTokenPercent`, `calcContextSize`                              |
| **Predicate helper**    | `is`/`has` + What                     | `isSessionExpired`, `hasCompletedExchanges`                        |
| **Component file**      | Noun phrase describing the UI element | `StreamSettingsMenu.vue`, `SubscribedEventItem.vue`                |
| **Composable file**     | `use-` + Domain concept               | `use-selected-model.ts`, `use-event-subscriptions.ts`              |
| **Helper file**         | Function name + `.helper.ts`          | `strip-html.helper.ts`, `calc-token-percent.helper.ts`             |
| **Test file**           | Same name + `.spec.ts`                | `strip-html.helper.spec.ts`, `use-exclusive-menu.spec.ts`          |
| **Story file**          | Same name + `.stories.ts`             | `ModelSelector.stories.ts`                                         |

The full checklist for finishing a task lives in [SKILL.md](./SKILL.md#checklist).
