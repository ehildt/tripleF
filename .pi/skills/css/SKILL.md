---
name: css
description: CSS architecture and component styling conventions. Use when creating or editing Vue component styles, writing scoped CSS, working with design system tokens (colors, spacing, typography), converting Tailwind @apply to plain CSS, adding new CSS tokens, or modifying palette/theme files.
---

# CSS Architecture & Component Styling

Read the full guide before writing or modifying any component styles:

→ [css-guide.md](css-guide.md)

## Quick Rules

1. **Use plain CSS with `var()` tokens** inside `<style scoped>`.
2. **Never use `@apply` or `@reference`.**
3. **Opacity colors** → `color-mix(in srgb, var(--color-token) N%, transparent)`.
4. **State variants** (`hover:`, `disabled:`, `focus:`) → real CSS pseudo-class blocks.
5. **Spacing** → `var(--spacing-*)` tokens; arbitrary values stay as `rem`.
6. **Fonts** → `var(--font-mono)` or `var(--font-sans)`.
7. **New tokens** go in `src/assets/css/tokens/` — only add values actually used.
8. **The scoped BEM block mirrors the component name.** A component's root class is its kebab-case name (`ChatRightToolbar` → `.chat-right-toolbar`); `__element` and `--modifier` suffixes extend it. Rename the block, elements, and modifiers in the same change as the component.
9. **Floating panels/menus carry a `__backdrop` element.** A fixed transparent backdrop sits beneath every teleported dropdown/popover so it can self-close on an outside click: `{block}__backdrop { position: fixed; inset: 0; z-index: <panel z-index − 1>; background: transparent; }` — the panel itself keeps the higher z-index. Do not paint the backdrop (no tint, no blur) for plain popovers; it is an invisible click-catcher (tint/blur is for modal surfaces like the lightbox/slide-over).
10. **No styling-only wrapper elements.** An element that exists solely to carry a class around a single child component is indirection — delete the wrapper and let the child own the style. Padding chrome wrapped around one component moves into that component's own scoped root rule (its BEM block). Bounds: this covers the component's *internal* chrome — padding between its edge and its content, its own background or border. *Outer* spacing stays in the parent's layout (gap tokens on the flex/grid container); a component never sets its own margins. The escape hatch that makes wrappers unnecessary: a class passed onto a child component lands on its root element, so the parent's scoped styles can style that root. Anything deeper is a deliberate `:deep()` with a reason comment, never a wrapper.

## Token Files

| File                    | Contains                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| `tokens/colors.css`     | All `--color-*` variables (backgrounds, foregrounds, accents, status, harmony, tab, method, borders, glow) |
| `tokens/layout.css`     | `--spacing-*` variables                                                                                    |
| `tokens/typography.css` | `--font-mono`, `--font-sans`                                                                               |
| `palettes/*.css`        | Per-palette color overrides via `[data-theme='...']`                                                       |
| `modes/light.css`       | Light-mode overrides via `:root[data-theme-mode='light']`                                                  |

## File Structure

The CSS lives in a single directory: `style.css` is the entry point (imports only, in cascade order); `tokens/` holds `@theme` blocks with variable defaults; `palettes/` holds per-palette color overrides; `modes/` holds display-mode overrides; `components/` holds global (unscoped) component styles.

## Adding a New Token

Add to the appropriate `@theme` block in `tokens/`, then override in palette files if the value differs per theme.
