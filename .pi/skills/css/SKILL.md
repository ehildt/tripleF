---
name: css
description: CSS architecture and component styling conventions. Use when creating or editing styles, writing Vue scoped CSS, working with design tokens, converting Tailwind syntax to plain CSS, adding tokens, or modifying palette and theme files.
---

# CSS Architecture Router

Use this router to load only the styling guidance required by the task. Dashboard stylesheet paths are rooted at `apps/dashboard/src/assets/css/` unless stated otherwise.

## Route the task

| Task | Read |
| --- | --- |
| Write plain CSS with tokens, BEM, states, transparency, or recurring visual patterns | [Component styles](conventions/component-styles.md) |
| Add or change tokens, palettes, display modes, global styles, or cascade imports | [Cascade and tokens](conventions/cascade-and-tokens.md) |
| Style a Vue SFC, rename a scoped BEM block, use deep selectors, or assign wrapper ownership | [Vue scoped styles](conventions/vue-scoped-styles.md) |
| Work with Tailwind `@theme`, migrate utility syntax, or review the Tailwind boundary | [Tailwind tokens](conventions/tailwind-tokens.md) |
| Review prohibited directives, hardcoded themed values, wrapper elements, or hidden coupling | [Styling anti-patterns](anti-patterns/styling-coupling.md) |
| Verify completed styling work | [Style verification](quality/style-verification.md) |

Load every applicable document. A new Vue component using the Tailwind token pipeline needs component styles, Vue scoped styles, Tailwind tokens, anti-pattern review, and final verification.

## Always apply

- Use plain CSS properties with `var()` token references and intentional BEM names.
- Never use `@apply` or `@reference`; do not introduce Tailwind utility classes for component styling.
- Themed color transparency uses `color-mix()` with the token, percentage, and transparent color.
- Hover, disabled, focus, and focus-within states use real CSS pseudo-class blocks.
- Spacing and font families use their tokens; small fixed sizes and font sizes use rem literals rather than invented tokens.
- Add only values actually consumed. Reuse an existing step rather than defining a duplicate token.
- A component owns its internal chrome; outer spacing remains with the parent's layout. Styling-only wrappers are removed.
- Every plain floating popover has an invisible fixed backdrop one z-index step below its panel; tint and blur belong to modal surfaces.
- Preserve cascade import order because token, palette, and mode overrides depend on it.
- Before completion, verify token resolution, states, specificity, palettes, and display modes through the quality guide.

## Official foundations

- [CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/--*)
- [CSS `var()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/var)
- [CSS `color-mix()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/color-mix)

Topic-specific documentation is linked from the relevant convention rather than aggregated here.
