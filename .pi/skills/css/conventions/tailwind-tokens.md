# Tailwind Token Boundary Convention

**Required when working with the Tailwind token pipeline or migrating Tailwind syntax.** Tailwind remains part of the dashboard build pipeline, while component styling itself is plain CSS. Official reference: [Tailwind functions and directives](https://tailwindcss.com/docs/functions-and-directives).

## Theme definitions

Token defaults live in `@theme` blocks inside the appropriate files under `apps/dashboard/src/assets/css/tokens/`. Add only values actually consumed and keep each value in its semantic category.

Palette and mode files override those variables rather than defining a parallel token system. Cascade order remains token defaults, palettes, then modes. See [cascade and tokens](cascade-and-tokens.md) for ownership and light-mode source-color rules.

`@theme` is the sanctioned Tailwind directive for token defaults. It does not permit `@apply`, `@reference`, or utility-class composition in Vue components.

## Migration to plain CSS

When encountering legacy Tailwind-oriented styling:

- Replace utility composition with plain CSS properties and BEM component classes.
- Replace slash-opacity or alpha-oriented color syntax with the documented sRGB `color-mix()` token tint.
- Replace hover, focus, disabled, and focus-within variants such as `hover:`, `focus:`, `disabled:`, and `focus-within:` with real pseudo-class blocks.
- Replace spacing utilities and adjacent-sibling helpers such as `space-y-*` and `space-x-*` with tokenized gap, padding, margin owned by the correct layout container, or the documented adjacent-sibling pattern.
- Replace arbitrary fixed pixel values with intentional rem literals; do not create a token for every literal.
- Replace font-family utilities with the mono or sans token and retain rem font sizes.
- Replace transition utilities such as `transition-colors` with explicit transitioned CSS properties.
- Replace ring utilities with real box-shadow properties when that is the visual behavior.

The migration is complete only when no `@apply`, `@reference`, or component utility-class dependency remains in the touched scope.

## Prose examples

- A themed background with a percentage opacity becomes a token-based color mix rather than a slash-opacity utility.
- A disabled opacity variant becomes a disabled pseudo-class block.
- A vertical space utility becomes either the parent's tokenized flex gap or an adjacent-sibling rule, depending on which unit owns the spacing.
- A new reusable spacing step enters the layout token theme block; a one-off fixed size remains a rem literal.

## Completion checklist

- `@theme` is used only for owned token defaults in the correct category file.
- Palette and mode overrides extend the same variables rather than creating parallel names.
- No prohibited directive or utility-class styling remains in touched component styles.
- Converted values preserve token, state, spacing, typography, and transition semantics.
