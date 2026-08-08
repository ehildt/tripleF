# CSS Architecture & Component Styling Guide

This guide explains how CSS is structured in this project and how to style Vue components using our design system tokens and plain CSS. All components have been migrated away from Tailwind's `@apply` — this is the reference for how we write styles going forward.

---

## Architecture

The CSS follows a three-layer cascade, enforced by import order in `style.css`:

```
Tokens (defaults)  →  Palettes (override token values)  →  Modes (override token values further)
```

| Layer      | Folder        | Purpose                                         | Contains                                      |
| ---------- | ------------- | ----------------------------------------------- | --------------------------------------------- |
| Tokens     | `tokens/`     | Design system variable definitions and defaults | `@theme { }` blocks only                      |
| Palettes   | `palettes/`   | Override token values per selected palette      | Only `[data-theme='...']` selectors           |
| Modes      | `modes/`      | Override token values per display mode          | Only `:root[data-theme-mode='...']` selectors |
| Components | `components/` | Global (unscoped) component styles              | Plain CSS using `var()` references            |
| Entry      | `style.css`   | Import orchestration, global resets, animations | `@import` statements in correct order         |

**The import order IS the architecture.** If you get it wrong, palette/mode overrides silently fail.

### File structure

```
css/
├── style.css                 ← Entry point: imports in order, global resets, animations
├── tokens/                   ← Design system definitions
│   ├── colors.css            ← @theme block: color tokens and defaults
│   ├── layout.css            ← @theme block: spacing, sizing tokens
│   └── typography.css        ← @theme block: font families
├── palettes/                 ← Color value overrides per palette
│   ├── souls.css, cyberpunk.css, ...
│   └── (13 palette files)
├── modes/                    ← Display mode overrides
│   └── light.css
└── components/               ← Global (unscoped) component styles
    └── chat.css
```

### Token categories

**Colors** (`tokens/colors.css`) — all variables start with `--color-`:

- Hue sources: `--color-accent-primary-source`, `--color-harmony-1..4-source`, `--color-status-*-source`, `--color-connection-*-source` — raw identity colors set by palettes. The final tokens (`--color-accent-primary`, `--color-harmony-1..4`, `--color-status-success/warning/error/info`, `--color-connection-connected/disconnected/error`) derive from them; light mode darkens the finals via `color-mix` with `#1c1c1e` so every palette keeps ≥ 4.5:1 contrast on light surfaces. Components always consume the final tokens, never the sources. (Exception: theme-preview swatches use `--color-accent-primary-source` to show a palette's raw identity color.)
- Background: `--color-bg-primary`, `--color-bg-secondary`, `--color-bg-tertiary`, `--color-bg-elevated`
- Foreground: `--color-fg-primary`, `--color-fg-secondary`, `--color-fg-muted`, `--color-fg-inverse`
- Accent: `--color-accent-primary`, `--color-accent-secondary`, `--color-accent-hover`, `--color-accent-active`, `--color-accent-border`, `--color-accent-glow`
- Harmony: `--color-harmony-1` through `--color-harmony-4`
- Tab: `--color-tab-rest`, `--color-tab-accent`, `--color-tab-debug`, `--color-tab-preprocessing`
- Status: `--color-status-success`, `--color-status-warning`, `--color-status-error`, `--color-status-info`
- Border: `--color-divider`
- Loading: `--color-loading`, `--color-loading-secondary`

**Spacing** (`tokens/layout.css`):

- `--spacing-0-5` (0.125rem), `--spacing-1` (0.25rem), `--spacing-1-5` (0.375rem), `--spacing-2` (0.5rem), `--spacing-3` (0.75rem), `--spacing-4` (1rem), `--spacing-9-5` (2.375rem)

**Typography** (`tokens/typography.css`):

- `--font-mono`, `--font-sans`

---

## Component Styling Rules

Inside `<style scoped>`, follow these rules:

1. **Use plain CSS properties with `var()` token references.** This is the only pattern.
2. **Never use `@apply`.** It creates tight coupling to Tailwind internals.
3. **Never use `@reference`.** It only exists to make `@apply` work.
4. **Never use Tailwind utility classes inside `<style>`.** Tailwind classes in `<template>` are a separate concern and out of scope for this guide.

### Token rules

- **Colors:** Always use `var(--color-*)` tokens. Never hardcode hex values for themed colors.
- **Spacing:** Always use `var(--spacing-*)` tokens. Prefer shorthand: `padding: var(--spacing-1) var(--spacing-2);` (top/bottom left/right).
- **Fonts:** Always use `var(--font-mono)` or `var(--font-sans)`. Never hardcode font stacks.
- **Font sizes:** Use rem values directly (`0.75rem`, `0.625rem`). There are no font-size tokens.
- **Arbitrary pixel values** (`w-3` = `0.75rem`, `h-3` = `0.75rem`): Use rem directly. Not everything needs a token.

### Opacity / color transparency

Tailwind's `/N` opacity syntax (`bg-tab-debug/10`) becomes `color-mix()`:

```
background-color: color-mix(in srgb, var(--color-tab-debug) 10%, transparent);
```

The formula is always:

```
color-mix(in srgb, var(--color-{token}) {percentage}%, transparent)
```

### State variants

Tailwind prefixes (`hover:`, `focus:`, `disabled:`, `focus-within:`) become real CSS pseudo-class blocks:

| Tailwind                | Plain CSS                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `hover:bg-tab-debug/10` | `.thing:hover { background-color: color-mix(in srgb, var(--color-tab-debug) 10%, transparent); }` |
| `hover:text-fg-primary` | `.thing:hover { color: var(--color-fg-primary); }`                                                |
| `disabled:opacity-50`   | `.thing:disabled { opacity: 0.5; }`                                                               |

### Spacing helpers

Tailwind's `space-y-*` / `space-x-*` becomes adjacent-sibling selectors:

```css
/* space-y-0.5 */
.parent > * + * {
  margin-top: var(--spacing-0-5);
}
```

---

## Onboarding New Components

When creating a new component, follow this process:

### 1. Check for existing tokens

Before writing any CSS, check whether the tokens you need already exist:

- **Color?** Look in `tokens/colors.css`. If a color serves a semantic purpose (e.g., border on error), it should be a token. If it's a one-off non-themed color, use the raw CSS value with a comment.
- **Spacing?** Look in `tokens/layout.css`. Use the closest token. If no token covers the value you need, add a new one to the `@theme` block — but only if it will be reused. One-off values can stay as rem literals.
- **Font?** Use `var(--font-mono)` or `var(--font-sans)`. Font-size values use rem directly.

### 2. Write the `<style scoped>` block

Use BEM-style class names and plain CSS:

```vue
<template>
  <div class="my-component">
    <span class="my-component__label">Hello</span>
  </div>
</template>

<style scoped>
.my-component {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-1) var(--spacing-3);
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 8%,
    transparent
  );
  border: 1px solid var(--color-divider);
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.my-component:hover {
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 12%,
    transparent
  );
}

.my-component__label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-fg-secondary);
}
</style>
```

### 3. If you need a new token

Add it to the correct token file:

**New color token** → `tokens/colors.css` (in the `@theme` block), then override in each palette file that needs a different value.

**New spacing token** → `tokens/layout.css` (in the `@theme` block). Only add if the value is reused across components.

**New font token** → `tokens/typography.css` (in the `@theme` block).

### 4. If you need global (unscoped) styles

Add them to `components/chat.css` or create a new file in `components/` and add an `@import` to `style.css` in the correct position (after tokens, palettes, and modes, but alongside other component imports).

---

## Reference Examples

### Simple layout + spacing — `PromptList.vue`

```css
.prompt-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.prompt-list__messages > * + * {
  margin-top: var(--spacing-0-5);
}
```

Pattern: `flex-col gap-2` → explicit flex properties with spacing token. `space-y-0.5` → adjacent-sibling selector.

### Opacity colors + borders — `PromptListMessage.vue`

```css
.prompt-message {
  background-color: color-mix(in srgb, var(--color-tab-debug) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-tab-debug) 20%, transparent);
}
```

Pattern: `bg-tab-debug/5` and `border-tab-debug/20` → `color-mix()` for both backgrounds and borders.

### Shorthand padding + typography — `PromptListBody.vue`

```css
.prompt-body {
  padding: var(--spacing-1) var(--spacing-2);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-primary);
  max-height: 200px;
  overflow-y: auto;
}
```

Pattern: `px-2 py-1` → `padding` shorthand (top/bottom left/right). `text-xs font-mono text-fg-primary` → individual CSS properties.

### Complex interactive states — `PromptListToggle.vue`

```css
.prompt-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-2);
  text-align: left;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.prompt-toggle:hover {
  background-color: color-mix(in srgb, var(--color-tab-debug) 10%, transparent);
}

.prompt-toggle__chevron-icon {
  display: block;
  width: 0.75rem;
  height: 0.75rem;
  color: color-mix(in srgb, var(--color-tab-debug) 70%, transparent);
  transition: transform 200ms ease;
}

.prompt-toggle__role {
  font-size: 0.625rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--color-fg-muted);
  text-transform: uppercase;
  flex-shrink: 0;
}

.prompt-toggle__preview {
  font-size: 0.625rem;
  font-family: var(--font-mono);
  color: color-mix(in srgb, var(--color-fg-muted) 50%, transparent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

Pattern: `hover:bg-*` → separate `:hover` block. `transition-colors duration-200` → explicit `transition` shorthand with `200ms`. `truncate` → three-property ellipsis. `text-fg-muted/50` → `color-mix()` at 50%.

### Dropdown with states + positioning — `DropDown.vue`

```css
.dropdown-trigger {
  width: 100%;
  padding: var(--spacing-1-5) var(--spacing-3);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  color: var(--color-fg-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.dropdown-trigger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dropdown-trigger:hover:not(:disabled) {
  color: var(--color-accent-primary);
}

.dropdown-menu {
  position: absolute;
  z-index: 50;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  max-height: 12rem;
  overflow-y: auto;
}

.dropdown-menu--center {
  left: 50%;
  transform: translateX(-50%);
  right: auto;
}
```

Pattern: `disabled:opacity-50 disabled:cursor-not-allowed` → `:disabled` block. `hover:not(:disabled)` for conditional hover. `left-1/2 -translate-x-1/2` → `left: 50%; transform: translateX(-50%);`. `shadow-lg` → explicit `box-shadow`.

### Icon button with animation — `IconButton.vue`

```css
.toolbar-icon-button {
  padding: var(--spacing-1-5);
  color: var(--color-fg-muted);
  border-radius: 0.25rem;
  flex-shrink: 0;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.toolbar-icon-button--blinking {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  box-shadow: 0 0 0 2px var(--color-accent-primary);
}
```

Pattern: `animate-pulse ring-2 ring-accent-primary` → `animation` referencing `@keyframes pulse` from `style.css`, `box-shadow` for ring. `ring-N ring-color` → `box-shadow: 0 0 0 Npx var(--color-*)`.

### Reusable list item — `ModelList.vue`

```css
.model-list-item {
  width: 100%;
  padding: var(--spacing-1-5) var(--spacing-3);
  text-align: left;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--color-fg-secondary);
  min-height: 2.5rem;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.model-list-item:hover {
  background-color: var(--color-bg-tertiary);
}
```

Pattern: `hover:bg-tertiary` → `:hover` block with background token. `min-h-[2.5rem]` → arbitrary Tailwind value becomes `min-height: 2.5rem;`.

### Badge with transparency — `CapabilityBadge.vue`

```css
.capability-badge {
  font-size: 0.625rem;
  padding: var(--spacing-0-5) var(--spacing-1);
  border-radius: 0.25rem;
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 10%,
    transparent
  );
  color: var(--color-accent-primary);
  font-family: var(--font-mono);
  line-height: 1.25;
}
```

Pattern: `bg-accent-primary/10` → `color-mix()` at 10%. `px-1 py-0.5` → shorthand padding. `leading-tight` → `line-height: 1.25`.

### Deep-selectored content with tokens — `ChatExchange.vue`

```css
.exchange-content :deep(div),
.exchange-content :deep(ul),
.exchange-content :deep(ol) {
  padding: var(--spacing-2);
}
```

Pattern: Even `:deep()` selectors use `var()` tokens — theme consistency applies everywhere.

---

## Quick Reference

### Colors

| Intent               | Token                           |
| -------------------- | ------------------------------- |
| Background primary   | `var(--color-bg-primary)`       |
| Background secondary | `var(--color-bg-secondary)`     |
| Background tertiary  | `var(--color-bg-tertiary)`      |
| Background elevated  | `var(--color-bg-elevated)`      |
| Text primary         | `var(--color-fg-primary)`       |
| Text secondary       | `var(--color-fg-secondary)`     |
| Text muted           | `var(--color-fg-muted)`         |
| Accent               | `var(--color-accent-primary)`   |
| Accent secondary     | `var(--color-accent-secondary)` |
| Borders              | `var(--color-divider)`          |
| Focus ring           | `var(--color-accent-primary)`   |
| Tab rest             | `var(--color-tab-rest)`         |
| Tab accent           | `var(--color-tab-accent)`       |
| Tab debug            | `var(--color-tab-debug)`        |
| Error                | `var(--color-status-error)`     |
| Success              | `var(--color-status-success)`   |

### Spacing

| Token           | Value    | Tailwind equiv |
| --------------- | -------- | -------------- |
| `--spacing-0-5` | 0.125rem | `0.5`          |
| `--spacing-1`   | 0.25rem  | `1`            |
| `--spacing-1-5` | 0.375rem | `1.5`          |
| `--spacing-2`   | 0.5rem   | `2`            |
| `--spacing-3`   | 0.75rem  | `3`            |
| `--spacing-4`   | 1rem     | `4`            |

### Common patterns

```css
/* Transparent color tint */
background-color: color-mix(
  in srgb,
  var(--color-accent-primary) 10%,
  transparent
);

/* Transparent border tint */
border: 1px solid color-mix(in srgb, var(--color-tab-debug) 20%, transparent);

/* Hover state */
.my-thing:hover {
  background-color: var(--color-bg-tertiary);
}

/* Disabled state */
.my-thing:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Focus ring */
.my-thing:focus-within {
  box-shadow: 0 0 0 1px var(--color-accent-primary);
}

/* Transition colors */
transition:
  color 0.2s ease,
  background-color 0.2s ease,
  border-color 0.2s ease;

/* Ellipsis / truncate */
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;

/* Ring */
box-shadow: 0 0 0 2px var(--color-accent-primary);
```

### Adding new tokens

Only add tokens that are actually used by components. Do not pre-build a full scale.

**New spacing value** — add to `tokens/layout.css` inside the `@theme` block:

```css
--spacing-5: 1.25rem; /* gap-5, p-5 */
```

**New color token** — add to `tokens/colors.css` inside `@theme`, then add overrides in each `palettes/*.css` that needs a different value. The palette files use `[data-theme='...']` selectors (no `:root`), so palette values can also be previewed on arbitrary elements — e.g. the theme selector renders swatches with `data-theme` on the swatch itself. If the new token is a hue that must stay legible in light mode, define it as a `*-source` token in the palettes, compose the final token in `tokens/colors.css`, and add a darkened `color-mix` override in `modes/light.css`.

**New font token** — add to `tokens/typography.css` inside `@theme`.

### Verifying changes

After creating or modifying a component's styles:

- [ ] `grep "@apply" <file>` returns zero results
- [ ] `grep "@reference" <file>` returns zero results
- [ ] All existing tests pass
- [ ] Storybook renders correctly (if stories exist)
- [ ] Palette switching still works (toggle between palettes)
- [ ] Light/dark mode still works
- [ ] Browser DevTools: all `var()` references resolve to computed values
- [ ] Browser DevTools: `:hover` states produce correct `color-mix()` values
- [ ] No specificity regressions — scoped styles apply at the same specificity level
