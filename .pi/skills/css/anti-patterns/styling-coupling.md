# Styling Coupling Anti-Patterns

Use this document before completing any component-style or token change. Each prohibition has a concrete ownership or maintenance reason.

## Tailwind composition directives

**Banned:** `@apply` and `@reference` in component styling.

`@apply` couples component CSS to Tailwind internals. `@reference` exists to make that composition work in contexts such as Vue SFCs and therefore extends the same dependency. Use plain CSS and token references instead. The sanctioned token-definition directive is documented in [Tailwind tokens](../conventions/tailwind-tokens.md).

Also do not introduce Tailwind utility classes into component templates as an alternative styling system. Tailwind remains in the build pipeline, but component styling stays plain CSS and BEM.

## Hardcoded themed values

**Banned:** hardcoded themed hex colors, font stacks, or ad-hoc spacing values that duplicate the scale.

These bypass palettes, display modes, and semantic consistency. Use final color tokens, spacing tokens, and font-family tokens. A one-off non-themed raw value may remain only with a reason comment; rem literals remain valid for font sizes and small fixed sizes.

Do not create duplicate or speculative tokens to work around an existing scale. Reuse the closest intentional step or add a genuinely consumed semantic value through the cascade convention.

## Styling-only wrappers

**Banned:** an element whose sole purpose is to hold a class around one child component.

The wrapper renders no concern and obscures whether parent or child owns the style. Delete it and let the child own internal padding, background, and border in its scoped root rule. Outer spacing belongs to the parent's flex or grid gaps; a child never sets its own outer margins.

A class passed onto a child lands on its root element and can handle intentional root styling. Anything deeper requires a deliberate deep selector with a reason comment. Never add a wrapper to avoid that explicit boundary.

## Condition-only wrappers

**Banned:** wrapper elements introduced only to carry a visibility condition around one component.

Place the condition directly on the component root. Combine this with correct chrome ownership rather than leaving an otherwise empty DOM layer.

## Unexplained deep selectors

**Banned:** reaching into a child's internal DOM through `:deep()` without an unavoidable reason and reason comment.

Deep selectors extend scoped-style reach and become fragile hidden coupling. Prefer root-class fallthrough, props, events, or moving chrome ownership. Every retained deep selector still uses design tokens and must be included in component rename sweeps.

## Painted plain-popover backdrops

**Banned:** tinting or blurring the invisible backdrop of an ordinary dropdown or popover, or omitting the backdrop that owns outside-click dismissal.

Plain floating panels use a fixed transparent viewport backdrop one z-index step below the panel. Tint and blur are reserved for intentional modal surfaces such as lightboxes and slide-overs.

## Review checklist

- No prohibited directive, utility styling, hardcoded themed value, or duplicate token was introduced.
- No styling-only or condition-only wrapper remains.
- Internal chrome, outer spacing, and conditions have direct owners.
- Every deep selector is necessary, commented, token-based, and included in renames.
- Floating-surface backdrops preserve their invisible click-catcher role and stacking order.
