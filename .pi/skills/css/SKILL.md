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

## Token Files

| File                    | Contains                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| `tokens/colors.css`     | All `--color-*` variables (backgrounds, foregrounds, accents, status, harmony, tab, method, borders, glow) |
| `tokens/layout.css`     | `--spacing-*` variables                                                                                    |
| `tokens/typography.css` | `--font-mono`, `--font-sans`                                                                               |
| `palettes/*.css`        | Per-palette color overrides via `:root[data-theme='...']`                                                  |
| `modes/light.css`       | Light-mode overrides via `:root[data-theme-mode='light']`                                                  |

## File Structure

```
src/assets/css/
├── style.css          ← Entry point (imports only)
├── tokens/            ← @theme blocks: variable defaults
├── palettes/          ← Per-palette color overrides
├── modes/             ← Display mode overrides
└── components/        ← Global unscoped component styles
```

## Adding a New Token

Add to the appropriate `@theme` block in `tokens/`, then override in palette files if the value differs per theme.
