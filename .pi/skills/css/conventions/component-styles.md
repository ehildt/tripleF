# Component Styles Convention

**Required.** Use this document for plain-CSS component styling, design-token consumption, state styling, and recurring visual patterns. Review [styling anti-patterns](../anti-patterns/styling-coupling.md) alongside it.

## Plain CSS and tokens

Use plain CSS properties with `var()` token references. Template classes use intentional BEM names rather than utility-class composition.

Colors use `--color-*` tokens; never hardcode hex values for themed colors. Spacing uses `--spacing-*` tokens, with shorthand padding where it improves readability. Font families use `--font-mono` or `--font-sans`; never hardcode font stacks.

Font sizes use rem values directly because there are no font-size tokens. Small arbitrary fixed sizes also use rem literals. Not every value needs a token.

A semantic reusable color or spacing value earns a token. A one-off non-themed raw CSS value may remain literal with a reason comment. Check existing color and layout tokens before adding anything, and use the closest existing spacing step.

## Transparency and state

Any transparent tint of a themed color uses `color-mix()` in the sRGB space with the themed token, a percentage, and `transparent`. This applies to backgrounds, borders, and text and replaces slash-opacity syntax.

Hover, focus, disabled, and focus-within variants become real pseudo-class blocks in the owning stylesheet. Each state block declares the properties that differ from the base rule. A disabled opacity variant belongs to the disabled pseudo-class; a hover accent that must not apply to disabled controls uses the appropriate combined pseudo-class condition.

Transitions list explicit properties such as color, background-color, and border-color rather than relying on a utility shorthand.

## Spacing and layout patterns

Adjacent-sibling spacing formerly expressed through vertical or horizontal space utilities becomes the `> * + *` adjacent-sibling selector with the nearest spacing token. Prefer a flex or grid container's tokenized gap when the container owns regular layout spacing.

Recurring patterns are expressed through existing components with the same concern:

- **Simple stack or list:** a column flex container with a tokenized gap, or adjacent-sibling separation at a smaller token when that ownership is intentional.
- **Tinted background and border:** a low-percentage token tint for the background and a slightly stronger tint of the same token for the border.
- **Padding and typography row:** shorthand tokenized padding, a rem font size, a font token, a foreground token, and bounded vertical overflow where needed.
- **Trigger with states:** full-width layout, tokenized padding and gap, explicit color transitions, a disabled state, and a hover state that excludes disabled controls.
- **Dropdown panel:** deliberate positioning and z-index, elevated background, divider border, token-mixed shadow, and bounded vertical scrolling. A `--center` modifier owns the centering transform.
- **Attention blink:** a `--blinking` BEM modifier drives a named pulse animation and box-shadow ring using real CSS properties.

## Floating-surface backdrop

Every floating menu or popover carries a fixed transparent backdrop covering the viewport one z-index step below its panel. Its purpose is solely to catch the outside-click gesture.

Do not paint, tint, or blur a plain popover backdrop. Those treatments belong to modal surfaces such as a lightbox or slide-over. The panel retains the higher z-index.

## Onboarding sequence

1. Inspect existing color, spacing, and typography tokens.
2. Write plain CSS with BEM names and token references.
3. Add a token only when the value is consumed and no existing semantic value fits; follow [cascade and tokens](cascade-and-tokens.md).
4. Use real pseudo-classes and explicit transitions.
5. Review prohibited coupling and complete [style verification](../quality/style-verification.md).

## Completion checklist

- All themed colors, spacing, and font families resolve through tokens.
- Rem literals are limited to font sizes and intentional fixed values.
- Transparency and state variants use their documented CSS forms.
- No duplicate token or utility-based shorthand was introduced.
- Floating surfaces have the correct invisible backdrop and z-index relationship.
