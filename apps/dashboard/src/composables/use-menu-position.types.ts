export type MenuPositionStyle = {
  left?: string;
  right?: string;
  top: string;
  minWidth?: string;
  transform?: string;
};

export type MenuAlign = 'left' | 'right';

/**
 * Vertical placement: `'top'` side-anchors the menu at the trigger's top
 * (toolbar menus), `'bottom'` opens the menu directly below the trigger,
 * hugging its left edge and never narrower than it (select-style fields).
 */
export type MenuSide = 'top' | 'bottom';
