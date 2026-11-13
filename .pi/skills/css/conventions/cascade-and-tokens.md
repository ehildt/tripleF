# Cascade and Token Convention

**Required.** Use this document when adding or changing token defaults, palettes, display modes, global styles, or stylesheet imports.

## Architecture

The dashboard stylesheet root is `apps/dashboard/src/assets/css/`. The cascade has three override layers whose import order is the architecture: token defaults, palette overrides, then display-mode overrides. Incorrect order silently prevents the intended value from winning.

| Layer | Location | Responsibility |
| --- | --- | --- |
| Tokens | `tokens/` | Design-variable definitions and defaults |
| Palettes | `palettes/` | Per-palette token-value overrides through theme attribute selectors |
| Modes | `modes/` | Display-mode overrides through root display-mode attribute selectors |
| Components | `components/` | Global unscoped component styles using token references |
| Entry | `style.css` | Imports in cascade order, global resets, and animations |

The entry file owns import orchestration. Token files contain variable defaults, palette files contain only per-theme attribute overrides, and mode files contain only root display-mode overrides. Global component files are divided by concern.

## Token files

- `tokens/colors.css` owns color variables for backgrounds, foregrounds, accents, statuses, harmonies, tabs, methods, borders, glow, connection state, and loading.
- `tokens/layout.css` owns spacing and sizing variables.
- `tokens/typography.css` owns the mono and sans font families.
- `palettes/*.css` owns per-palette color overrides selected through `[data-theme='...']`.
- `modes/light.css` owns light-mode overrides selected through `:root[data-theme-mode='light']`.

Palette selectors do not require the root element, so a theme preview can place the theme attribute on an arbitrary swatch and preview its values.

## Color categories and source colors

All color variables begin with `--color-`. Backgrounds include primary, secondary, tertiary, and elevated surfaces. Foregrounds include primary, secondary, muted, and inverse text. Additional semantic families cover accent, four harmonies, tab state, status, divider, loading, and connection state.

Raw identity colors are `*-source` tokens for the accent, harmonies, statuses, and connection states. Palettes set those source values. Final semantic tokens derive from the sources, and light mode darkens finals so every palette preserves at least 4.5:1 contrast on light surfaces.

Components consume final tokens, never source tokens. Theme-preview swatches are the intentional exception because they display the palette's raw identity color.

## Spacing and typography

Spacing follows the existing fixed scale of quarter, half, three-quarter, and related rem steps plus its documented outliers. Use the corresponding `--spacing-*` token and never create a duplicate step.

Typography provides only mono and sans font families. Font sizes remain direct rem values.

## Adding or changing a token

Only add values actually used by components; do not pre-build a speculative scale.

1. Choose the token file matching the semantic category.
2. Add the default in the appropriate theme-definition block. Tailwind-specific directive rules are in [Tailwind tokens](tailwind-tokens.md).
3. Add overrides in every palette whose value differs.
4. If a hue must remain legible in light mode, define its source hue in palettes, compose the final semantic token in the color token file, and add the darkened final override in the light-mode file.
5. Verify every consuming component and palette/mode combination.

A new spacing value belongs to layout tokens, a new color to color tokens, and a new font family to typography tokens.

## Global styles

Add global unscoped rules to an existing concern-matching component stylesheet or create a concern-specific file in `components/`. Import it from the entry point with `@import` after tokens, palettes, and modes, alongside other global component imports. Do not bypass cascade order.

## Common semantic color intents

Use the semantic token matching intent: primary through elevated backgrounds, primary through muted foregrounds, primary or secondary accent, divider for borders, accent primary for focus, tab rest/accent/debug for tabs, and status error or success for those outcomes. Inspect the token file for the exact current variable name rather than inventing a spelling.

## Completion checklist

- Import order preserves defaults, palettes, modes, then global component styles.
- Every value lives in its semantic token, palette, mode, or global-component owner.
- Components consume final rather than source color tokens except intentional theme swatches.
- New values are used, non-duplicative, and overridden only where necessary.
- Light-mode contrast and palette previews retain their documented behavior.
