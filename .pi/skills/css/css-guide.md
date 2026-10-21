# CSS Architecture & Component Styling Guide

This guide explains how CSS is structured in this project and how to style Vue components using our design system tokens and plain CSS. All components have been migrated away from Tailwind's `@apply` — this is the reference for how we write styles going forward.

**Skill files are prose-only.** This guide states rules in words. It deliberately contains no code examples — the conventions it describes are visible in the codebase itself, which is the authoritative example.

---

## Architecture

The CSS follows a three-layer cascade, enforced by import order in the entry file:

Tokens (defaults) → Palettes (override token values per palette) → Modes (override token values further per display mode).

| Layer      | Folder        | Purpose                                         | Contents                                                |
| ---------- | ------------- | ----------------------------------------------- | ------------------------------------------------------- |
| Tokens     | `tokens/`     | Design system variable definitions and defaults | `@theme` blocks only                                    |
| Palettes   | `palettes/`   | Override token values per selected palette      | Only per-theme attribute selectors                      |
| Modes      | `modes/`      | Override token values per display mode          | Only root attribute selectors for the display mode      |
| Components | `components/` | Global (unscoped) component styles              | Plain CSS using `var()` references                      |
| Entry      | `style.css`   | Import orchestration, global resets, animations | `@import` statements in correct order                    |

**The import order IS the architecture.** If you get it wrong, palette/mode overrides silently fail.

### File structure

The stylesheet tree is organized as:

- `style.css` — the entry point: imports in cascade order, global resets, animations.
- `tokens/` — design system definitions, one file per category: color tokens and defaults, spacing/sizing tokens, and font families.
- `palettes/` — one file per palette overriding color token values (13 palette files).
- `modes/` — display-mode overrides (light mode).
- `components/` — global (unscoped) component styles, one file per concern.

### Token categories

**Colors** — all variables start with `--color-`:

- **Hue sources** vs finals: raw identity colors (`*-source` tokens for the accent, each harmony, each status, and each connection state) are set by palettes. The final tokens (accent primary, harmonies, statuses, connection states) derive from them. Light mode darkens the finals so every palette keeps ≥ 4.5:1 contrast on light surfaces. Components always consume the final tokens, never the sources — except theme-preview swatches, which intentionally show a palette's raw identity color.
- **Backgrounds**: primary, secondary, tertiary, elevated.
- **Foregrounds**: primary, secondary, muted, inverse.
- **Accent**: primary, secondary, hover, active, border, glow.
- **Harmony**: four numbered harmony colors.
- **Tab**: rest, accent, debug, preprocessing.
- **Status**: success, warning, error, info.
- **Border**: a single divider token.
- **Loading**: two tokens (primary + secondary).

**Spacing** — a fixed scale of roughly quarter/half/x.5/x.75-rem steps, plus two outliers; use the `--spacing-*` tokens, don't invent ad-hoc ones.

**Typography** — the two font families: mono and sans. Font **sizes** are rem values directly (there are no font-size tokens).

---

## Component Styling Rules

Inside `<style scoped>`, follow these rules:

1. **Use plain CSS properties with `var()` token references.** This is the only pattern.
2. **Never use `@apply`.** It creates tight coupling to Tailwind internals.
3. **Never use `@reference`.** It only exists to make `@apply` work.
4. **Never use Tailwind utility classes inside `<style>`.** Tailwind classes in `<template>` are a separate concern and out of scope for this guide.

### Token rules

- **Colors:** Always use `var(--color-*)` tokens. Never hardcode hex values for themed colors.
- **Spacing:** Always use `var(--spacing-*)` tokens. Prefer shorthand padding (top/bottom left/right).
- **Fonts:** Always use one of the two font-family tokens. Never hardcode font stacks.
- **Font sizes:** Use rem values directly. There are no font-size tokens.
- **Arbitrary pixel values:** Use rem directly for small fixed sizes. Not everything needs a token.

### Opacity / color transparency

Any transparent tint of a themed color becomes a `color-mix(in srgb, …)` call: the themed color token, a percentage, and `transparent`. This is the only way to express a percent tint of a token — it replaces Tailwind's slash-opacity syntax everywhere it appears (backgrounds, borders, text).

### State variants

State variants (`hover:`, `focus:`, `disabled:`, `focus-within:`) become real CSS pseudo-class blocks in the component's own scoped stylesheet — one block per state, same properties as the base rule. `hover:` on a color becomes a `:hover` block with the token (or `color-mix` tint); `disabled:opacity` becomes a `:disabled` block.

### Spacing helpers

Adjacent-sibling spacing (like Tailwind's `space-y-*` / `space-x-*`) becomes the adjacent-sibling selector (`> * + *`) with a margin set to the nearest spacing token.

---

## Onboarding New Components

When creating a new component, follow this process:

### 1. Check for existing tokens

Before writing any CSS, check whether the tokens you need already exist:

- **Color?** Look in the color tokens file. If a color serves a semantic purpose (e.g., a border-on-error), it should be a token. If it's a one-off non-themed color, use the raw CSS value with a comment.
- **Spacing?** Look in the layout tokens file. Use the closest token. If no token covers the value you need, add a new one to the `@theme` block — but only if it will be reused. One-off values can stay as rem literals.
- **Font?** Use one of the two font-family tokens. Font-size values use rem directly.

### 2. Write the `<style scoped>` block

Use BEM-style class names and plain CSS: the component's root class is its kebab-case name; modifiers double-dash, elements double-underscore. All colors/spacing/fonts come from tokens; state variants are real pseudo-class blocks; transitions are explicit properties (no `transition-colors` shorthand).

### 3. If you need a new token

Add it to the correct token file, in the `@theme` block, and override in each palette file that needs a different value:

- **New spacing value** → the layout tokens file.
- **New color token** → the color tokens file; add overrides in each palette that needs a different value. Palette files select on the theme attribute only (no root), so palette values can also be previewed on arbitrary elements (e.g., the theme selector renders swatches with the theme attribute on the swatch itself). If the new token is a hue that must stay legible in light mode, define it as a `*-source` token in the palettes, compose the final token in the color tokens file, and add a darkened override in the light-mode file.
- **New font token** → the typography tokens file.

### 4. If you need global (unscoped) styles

Add them to the existing component styles file or create a new file in `components/` and add an `@import` to the entry point in the correct cascade position (after tokens, palettes, and modes, alongside other component imports).

---

## Reference patterns (in words)

These are recurring styles expressed as plain prose — copy the shape from any existing component that has the same concern:

- **Simple stack/list with item spacing**: a column flex container at a spacing-token gap; items separated with the adjacent-sibling selector at a smaller spacing token.
- **Tinted background + border**: a `color-mix` tint of a themed token at a low percentage for the background; a slightly higher tint of the same token for the border.
- **Padding + typography row**: shorthand padding across a two-token rhythm, a rem font size, the mono font, a foreground color token, plus a max-height with vertical scroll for overflow.
- **Trigger button with states**: full width, shorthand padding, flex row at a spacing gap, explicit transition over `color`/`background-color`/`border-color`. A `:disabled` block for opacity/cursor, a `:hover:not(:disabled)` block for the accent color.
- **Dropdown panel**: absolute position under the trigger with a fixed z-index, elevated background token, divider border, a shadow with a token-mixed color, and a max-height with vertical scroll. A `--center` modifier centers it via left-50% + a half-width translate.
- **Icon button with attention blink**: a transition over color tokens; a `--blinking` modifier driving a named pulse animation and a small spread ring via box-shadow (keeps the ring a real CSS property, not Tailwind's ring).
- **Deeply nested content**: `:deep()` selectors still use only `var()` tokens — theme consistency applies everywhere scoped styles reach.
- **The invisible backdrop**: every floating menu/popover carries a fixed transparent backdrop element covering the viewport, one z-index step under the panel, with only a click-handler — no tint, no blur (those are for modal surfaces like the lightbox and slide-over).

---

## Quick Reference

### Colors

| Intent               | Token (use `var(…)`)          |
| -------------------- | ----------------------------- |
| Background primary   | color bg primary              |
| Background secondary | color bg secondary            |
| Background tertiary  | color bg tertiary             |
| Background elevated  | color bg elevated             |
| Text primary         | color fg primary              |
| Text secondary       | color fg secondary            |
| Text muted           | color fg muted                |
| Accent               | color accent primary          |
| Accent secondary     | color accent secondary        |
| Borders              | color divider                 |
| Focus ring           | color accent primary          |
| Tab rest             | color tab rest                |
| Tab accent           | color tab accent              |
| Tab debug            | color tab debug               |
| Error                | color status error            |
| Success              | color status success          |

### Spacing

The spacing scale steps in quarter/half rem increments; use the corresponding `--spacing-*` token and nothing else. Do not invent ad-hoc spacing tokens that duplicate an existing step.

### Adding new tokens

Only add tokens that are actually used by components. Do not pre-build a full scale. When adding one:

- **New spacing value** → the layout tokens file.
- **New color token** → the color tokens file, with a value override in every palette that needs a different one. If it's a hue that must stay legible in light mode, define the source hue in palettes, compose the final token in the color tokens file, and add the darkened override in the light-mode file.
- **New font token** → the typography tokens file.

### Verifying changes

After creating or modifying a component's styles:

- [ ] `grep "@apply"` returns zero results in the modified file
- [ ] `grep "@reference"` returns zero results in the modified file
- [ ] All existing tests pass
- [ ] Storybook renders correctly (if stories exist)
- [ ] Palette switching still works (toggle between palettes)
- [ ] Light/dark mode still works
- [ ] Browser DevTools: all `var()` references resolve to computed values
- [ ] Browser DevTools: hover states produce the correct `color-mix()` values
- [ ] No specificity regressions — scoped styles apply at the same specificity level
- [ ] No wrapper elements that exist only to hold a class around one child component — the child owns its padding chrome in its own scoped rule (rule 10)
