/**
 * Where the menu row lives, which decides its surface treatment:
 *
 * - `header` — inside a fixed-height panel-header bar: transparent and
 *   padding-free (the bar owns surface and side padding), with the buttons
 *   bottom-aligned so their underline sits on the bar's bottom edge.
 * - `section` — a standalone strip at the top of a settings section: the
 *   secondary surface, the standard horizontal inset, and air (`spacing-3`)
 *   below the underline.
 * - `panel` — an action row inside a settings panel: transparent, the
 *   standard horizontal inset, and more guaranteed air (`spacing-4`) below
 *   the underline whatever the parent panel's gap is.
 */
type MenuRowVariant = 'header' | 'section' | 'panel';

export interface MenuRowProps {
  /** Which hosting surface the row renders on. */
  variant: MenuRowVariant;
}
