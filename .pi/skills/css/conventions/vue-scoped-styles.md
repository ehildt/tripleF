# Vue Scoped Styles Convention

**Required when styling Vue SFCs.** Use plain CSS inside the component's scoped style block and read [component styles](component-styles.md) plus [styling anti-patterns](../anti-patterns/styling-coupling.md). Official API background: [Vue SFC CSS features](https://vuejs.org/api/sfc-css-features.html#scoped-css).

## BEM ownership

The scoped BEM block mirrors the component name. The root class is the component's kebab-case name; `__element` suffixes identify elements and `--modifier` suffixes identify modifiers. For example, `ChatRightToolbar` owns the `.chat-right-toolbar` block.

A component's root class is its own block, never an element of its parent's block. Deeply nested content still uses token references because theme consistency applies wherever scoped styles reach.

When a component is renamed, rename its BEM block, elements, and modifiers in the same change. Update deep selectors and DOM query strings that target old classes; those lookups otherwise fail silently.

## Internal chrome versus outer spacing

An element that exists only to carry a class around one child component is indirection and is removed. Padding chrome around one component moves into that component's own scoped root rule.

Internal chrome includes padding between the component's edge and content and its own background or border. Outer spacing stays in the parent's flex or grid layout through tokenized gaps. A component never sets its own margins to negotiate outer spacing.

A class passed to a child component lands on its root element, so the parent's scoped styles can intentionally style that root without adding a wrapper. Anything deeper requires a deliberate `:deep()` selector with a reason comment, never a wrapper solely to make targeting possible.

## Conditions and wrappers

Move a visibility condition onto the component root rather than adding a condition-only wrapper. The child owns its internal chrome and the parent owns outer layout spacing. No element is introduced only for a conditional directive or one spacing class.

## Teleported floating surfaces

A teleported dropdown or popover still follows the invisible-backdrop convention. Its fixed transparent backdrop covers the viewport and sits one z-index step below the panel so the component can self-close on an outside click.

The backdrop has no tint or blur for plain popovers. Modal surfaces such as a lightbox or slide-over may intentionally use those treatments. Trigger positioning and dismissal remain component concerns rather than reasons for coordinator-level DOM selector coupling.

## Prose examples

- A toolbar's root class is the kebab-case form of its component name, and its internal padding belongs to that root rule. The parent list's gap controls spacing between toolbar siblings.
- A parent styles a child's root through the class passed to that child. It uses a commented deep selector only when a truly internal target is unavoidable.
- Renaming a panel includes its root block, modifiers, deep selectors, and every DOM query that refers to the old block.

## Completion checklist

- The scoped root block and all suffixes match the component identity.
- No utility-class or Tailwind-directive dependency appears in the scoped block.
- Internal chrome and outer spacing have the correct owners.
- No styling-only or condition-only wrapper exists.
- Deep selectors are necessary and carry reason comments.
- Floating surfaces and renames preserve all CSS and DOM references.
