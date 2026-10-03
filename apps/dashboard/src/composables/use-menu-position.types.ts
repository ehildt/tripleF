export type MenuPositionStyle = {
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
  minWidth?: string;
  transform?: string;
};

export type MenuAlign = 'left' | 'right';

/**
 * Vertical placement: `'top'` side-anchors the menu at the trigger's top
 * (toolbar menus), `'bottom'` opens the menu directly below the trigger,
 * hugging its left edge and never narrower than it (select-style fields),
 * `'above'` opens the menu above the trigger, left edges aligned — for
 * triggers that sit at the bottom of the viewport (prompt-bar menus).
 */
export type MenuSide = 'top' | 'bottom' | 'above';
